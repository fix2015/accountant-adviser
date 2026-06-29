from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, get_active_consultation
from app.modules.users.models import User
from app.modules.payments.models import Consultation
from app.modules.documents.schemas import (
    DocumentResponse,
    DocumentListResponse,
    DocumentUploadResponse,
    FolderResponse,
    OrganizedDocumentsResponse,
)
from app.modules.documents import services

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/documents", tags=["documents"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/upload", response_model=DocumentUploadResponse)
@limiter.limit("30/minute")
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    # Check trial document limit (1 document for free trial)
    if getattr(consultation, "is_trial", False):
        from app.modules.documents.models import Document as DocumentModel

        doc_count = (
            db.query(DocumentModel)
            .filter(DocumentModel.consultation_id == consultation.id)
            .count()
        )
        if doc_count >= 1:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Free trial allows only 1 document upload. Upgrade to full consultation for unlimited uploads.",
            )

    file_content = await file.read()
    file_size = len(file_content)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds 10MB limit",
        )

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required",
        )

    try:
        document = services.create_document(
            db=db,
            consultation_id=consultation.id,
            user_id=current_user.id,
            filename=file.filename,
            file_content=file_content,
            content_type=file.content_type or "application/octet-stream",
            file_size=file_size,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    # Process document inline (extract text)
    services.process_document_inline(db, document, file_content)

    # Build knowledge entries from extracted text
    if document.extracted_text:
        from app.modules.knowledge.services import build_knowledge_from_document

        build_knowledge_from_document(db, document)

    return DocumentUploadResponse(
        id=document.id,
        filename=document.filename,
        status=document.status,
        message="Document uploaded and processed successfully",
    )


@router.post("/upload-zip")
@limiter.limit("5/minute")
async def upload_zip(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    """Upload a .zip archive and process all supported files inside it."""
    import zipfile
    import io
    import os

    if not file.filename or not file.filename.lower().endswith(".zip"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .zip files are accepted",
        )

    zip_content = await file.read()
    zip_size = len(zip_content)

    MAX_ZIP_SIZE = 100 * 1024 * 1024  # 100MB
    if zip_size > MAX_ZIP_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="ZIP file exceeds 100MB limit",
        )

    try:
        zf = zipfile.ZipFile(io.BytesIO(zip_content))
    except zipfile.BadZipFile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or corrupted ZIP file",
        )

    SUPPORTED_EXTENSIONS = {"pdf", "docx", "doc", "txt", "csv"}
    MAX_FILES = 50
    MAX_INDIVIDUAL_SIZE = 10 * 1024 * 1024  # 10MB
    MAX_DEPTH = 3
    SKIP_PREFIXES = ("__MACOSX", ".DS_Store")

    results = []
    processed = 0
    skipped = 0
    errors = 0

    entries = [info for info in zf.infolist() if not info.is_dir()]

    for info in entries:
        name = info.filename
        basename = os.path.basename(name)

        # Skip hidden files and macOS artifacts
        if basename.startswith(".") or any(
            name.startswith(p) or ("/" + p) in name for p in SKIP_PREFIXES
        ):
            skipped += 1
            results.append({"filename": basename, "status": "skipped"})
            continue

        # Check depth
        depth = name.count("/")
        if depth > MAX_DEPTH:
            skipped += 1
            results.append({"filename": basename, "status": "skipped"})
            continue

        # Check extension
        ext = basename.rsplit(".", 1)[-1].lower() if "." in basename else ""
        if ext not in SUPPORTED_EXTENSIONS:
            skipped += 1
            results.append({"filename": basename, "status": "skipped"})
            continue

        # Check individual file size
        if info.file_size > MAX_INDIVIDUAL_SIZE:
            skipped += 1
            results.append({"filename": basename, "status": "skipped"})
            continue

        # Check max files
        if processed >= MAX_FILES:
            skipped += 1
            results.append({"filename": basename, "status": "skipped"})
            continue

        try:
            file_content = zf.read(info.filename)

            # Map extension to content type
            content_type_map = {
                "pdf": "application/pdf",
                "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "doc": "application/msword",
                "txt": "text/plain",
                "csv": "text/csv",
            }
            content_type = content_type_map.get(ext, "application/octet-stream")

            document = services.create_document(
                db=db,
                consultation_id=consultation.id,
                user_id=current_user.id,
                filename=basename,
                file_content=file_content,
                content_type=content_type,
                file_size=len(file_content),
            )

            services.process_document_inline(db, document, file_content)

            if document.extracted_text:
                from app.modules.knowledge.services import build_knowledge_from_document

                build_knowledge_from_document(db, document)

            processed += 1
            results.append({"filename": basename, "status": "processed"})
        except Exception as e:
            errors += 1
            results.append({"filename": basename, "status": f"error: {str(e)}"})

    zf.close()

    return {
        "processed": processed,
        "skipped": skipped,
        "errors": errors,
        "files": results,
    }


FOLDER_CONFIG = {
    "payslip": {"name": "Payslips", "icon": "receipt"},
    "invoice": {"name": "Invoices", "icon": "file-text"},
    "bank_statement": {"name": "Bank Statements", "icon": "landmark"},
    "tax_return": {"name": "Tax Returns", "icon": "file-check"},
    "receipt": {"name": "Receipts", "icon": "receipt"},
    "contract": {"name": "Contracts", "icon": "file-signature"},
    "other": {"name": "Other Documents", "icon": "file"},
}


@router.get("/organized", response_model=OrganizedDocumentsResponse)
def get_organized_documents(
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    documents, total = services.get_consultation_documents(
        db, consultation.id, skip=0, limit=1000
    )

    # Group documents by document_type
    grouped: dict[str, list] = {}
    for doc in documents:
        doc_type = doc.document_type or "other"
        if doc_type not in FOLDER_CONFIG:
            doc_type = "other"
        grouped.setdefault(doc_type, []).append(doc)

    folders = []
    for doc_type, config in FOLDER_CONFIG.items():
        docs = grouped.get(doc_type, [])
        if docs:
            folders.append(
                FolderResponse(
                    name=config["name"],
                    type=doc_type,
                    icon=config["icon"],
                    count=len(docs),
                    documents=[DocumentResponse.model_validate(d) for d in docs],
                )
            )

    return OrganizedDocumentsResponse(
        folders=folders,
        total_documents=total,
        total_folders=len(folders),
    )


@router.get("/", response_model=DocumentListResponse)
def list_documents(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    documents, total = services.get_consultation_documents(
        db, consultation.id, skip, limit
    )
    return DocumentListResponse(documents=documents, total=total)


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = services.get_document_by_id(db, document_id, current_user.id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return document


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = services.get_document_by_id(db, document_id, current_user.id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    services.delete_document(db, document)
    return None
