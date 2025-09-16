import { storage, auth } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export interface UploadResult {
  success: boolean;
  downloadURL?: string;
  error?: string;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  downloadURL: string;
}

/**
 * Upload a file to Firebase Storage
 * @param file - The file to upload
 * @param orgId - Organization ID
 * @param employeeId - Employee ID
 * @param documentType - Type of document (e.g., 'governmentId', 'resume')
 * @param onProgress - Optional progress callback
 * @returns Promise with upload result
 */
export async function uploadEmployeeDocument(
  file: File,
  orgId: string,
  employeeId: string,
  documentType: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  try {
    // Validate file
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Validate parameters
    if (!orgId || !employeeId) {
      return { success: false, error: 'Missing organization ID or employee ID' };
    }

    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Create storage reference
    const fileName = `${documentType}_${Date.now()}_${file.name}`;
    const storagePath = `organizations/${orgId}/employeeUploads/${employeeId}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    // Upload file
    const uploadTask = uploadBytes(storageRef, file);
    
    // Simulate progress (Firebase Storage doesn't provide real-time progress for uploadBytes)
    if (onProgress) {
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 90) {
          progress = 90;
          clearInterval(progressInterval);
        }
        onProgress(progress);
      }, 200);
    }

    const snapshot = await uploadTask;
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    if (onProgress) {
      onProgress(100);
    }

    return {
      success: true,
      downloadURL
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Delete a file from Firebase Storage
 * @param downloadURL - The download URL of the file to delete
 * @returns Promise with deletion result
 */
export async function deleteEmployeeDocument(downloadURL: string): Promise<UploadResult> {
  try {
    // Extract file path from download URL
    const url = new URL(downloadURL);
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
    
    if (!pathMatch) {
      return { success: false, error: 'Invalid download URL' };
    }

    const filePath = decodeURIComponent(pathMatch[1]);
    const fileRef = ref(storage, filePath);
    
    await deleteObject(fileRef);
    
    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    };
  }
}

/**
 * Create file metadata object
 * @param file - The original file
 * @param downloadURL - The download URL from Firebase Storage
 * @returns File metadata object
 */
export function createFileMetadata(file: File, downloadURL: string): FileMetadata {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    uploadedAt: new Date().toISOString(),
    downloadURL
  };
}

/**
 * Format file size for display
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file type icon
 * @param fileType - MIME type of the file
 * @returns Icon name or emoji
 */
export function getFileTypeIcon(fileType: string): string {
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('image')) return '🖼️';
  return '📎';
}

/**
 * Validate file before upload
 * @param file - The file to validate
 * @returns Validation result with error message if invalid
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  // Check file type
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed. Only PDF, JPG, and PNG files are accepted.' };
  }

  return { valid: true };
}
