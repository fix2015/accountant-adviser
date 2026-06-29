from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, get_active_consultation
from app.modules.users.models import User
from app.modules.payments.models import Consultation
from app.modules.documents.schemas import (
    DocumentResponse,
    DocumentListResponse,
    DocumentUploadResponse,
)
from app.modules.documents import services

router = APIRouter(prefix="/documents", tags=["documents"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
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
