import { supabase } from '@/lib/supabase';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

export interface FileUploadResult {
	success: boolean;
	url?: string;
	path?: string;
	error?: string;
}

export interface FileUploadOptions {
	bucket: string;
	folder: string;
	fileName?: string;
	fileType?: 'image' | 'document';
	maxSize?: number; // MB
}

// 파일 타입별 MIME 타입 매핑
const MIME_TYPES = {
	image: {
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		png: 'image/png',
		gif: 'image/gif',
		webp: 'image/webp',
	},
	document: {
		pdf: 'application/pdf',
		doc: 'application/msword',
		docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		xls: 'application/vnd.ms-excel',
		xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		txt: 'text/plain',
	},
};

// 파일 확장자 추출
const getFileExtension = (fileName: string): string => {
	return fileName.split('.').pop()?.toLowerCase() || '';
};

// MIME 타입 확인
const getMimeType = (fileName: string, fileType: 'image' | 'document'): string => {
	const extension = getFileExtension(fileName);
	return MIME_TYPES[fileType][extension as keyof typeof MIME_TYPES[typeof fileType]] || 'application/octet-stream';
};

// 파일 크기 확인 (MB)
const checkFileSize = (fileSize: number, maxSize: number): boolean => {
	const fileSizeMB = fileSize / (1024 * 1024);
	return fileSizeMB <= maxSize;
};

// 이미지 선택 및 업로드
export const pickAndUploadImage = async (
	options: FileUploadOptions
): Promise<FileUploadResult> => {
	try {
		// 권한 요청
		const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

		if (permissionResult.granted === false) {
			return {
				success: false,
				error: '갤러리 접근 권한이 필요합니다.',
			};
		}

		// 이미지 선택
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [4, 3],
			quality: 0.8,
		});

		if (result.canceled) {
			return {
				success: false,
				error: '이미지 선택이 취소되었습니다.',
			};
		}

		const asset = result.assets[0];
		if (!asset) {
			return {
				success: false,
				error: '이미지를 선택할 수 없습니다.',
			};
		}

		// 파일 크기 확인
		if (options.maxSize && !checkFileSize(asset.fileSize || 0, options.maxSize)) {
			return {
				success: false,
				error: `파일 크기가 ${options.maxSize}MB를 초과합니다.`,
			};
		}

		// 파일명 생성
		const timestamp = Date.now();
		const extension = getFileExtension(asset.fileName || 'image.jpg');
		const fileName = options.fileName || `image_${timestamp}.${extension}`;
		const filePath = `${options.folder}/${fileName}`;

		// 파일을 ArrayBuffer로 변환
		const response = await fetch(asset.uri);
		const arrayBuffer = await response.arrayBuffer();

		// Supabase Storage에 업로드
		const { data, error } = await supabase.storage
			.from(options.bucket)
			.upload(filePath, arrayBuffer, {
				contentType: getMimeType(fileName, 'image'),
				upsert: false,
			});

		if (error) {
			console.error('Supabase upload error:', error);
			return {
				success: false,
				error: `업로드 실패: ${error.message}`,
			};
		}

		// 공개 URL 생성
		const { data: urlData } = supabase.storage
			.from(options.bucket)
			.getPublicUrl(filePath);

		return {
			success: true,
			url: urlData.publicUrl,
			path: filePath,
		};
	} catch (error) {
		console.error('Image upload error:', error);
		return {
			success: false,
			error: `이미지 업로드 중 오류가 발생했습니다: ${error}`,
		};
	}
};

// 문서 선택 및 업로드
export const pickAndUploadDocument = async (
	options: FileUploadOptions
): Promise<FileUploadResult> => {
	try {
		// 문서 선택
		const result = await DocumentPicker.getDocumentAsync({
			type: '*/*',
			copyToCacheDirectory: true,
		});

		if (result.canceled) {
			return {
				success: false,
				error: '문서 선택이 취소되었습니다.',
			};
		}

		const asset = result.assets[0];
		if (!asset) {
			return {
				success: false,
				error: '문서를 선택할 수 없습니다.',
			};
		}

		// 파일 크기 확인
		if (options.maxSize && !checkFileSize(asset.size || 0, options.maxSize)) {
			return {
				success: false,
				error: `파일 크기가 ${options.maxSize}MB를 초과합니다.`,
			};
		}

		// 파일명 생성
		const timestamp = Date.now();
		const extension = getFileExtension(asset.name);
		const fileName = options.fileName || `document_${timestamp}.${extension}`;
		const filePath = `${options.folder}/${fileName}`;

		// 파일을 ArrayBuffer로 변환
		const response = await fetch(asset.uri);
		const arrayBuffer = await response.arrayBuffer();

		// Supabase Storage에 업로드
		const { data, error } = await supabase.storage
			.from(options.bucket)
			.upload(filePath, arrayBuffer, {
				contentType: getMimeType(fileName, 'document'),
				upsert: false,
			});

		if (error) {
			console.error('Supabase upload error:', error);
			return {
				success: false,
				error: `업로드 실패: ${error.message}`,
			};
		}

		// 공개 URL 생성
		const { data: urlData } = supabase.storage
			.from(options.bucket)
			.getPublicUrl(filePath);

		return {
			success: true,
			url: urlData.publicUrl,
			path: filePath,
		};
	} catch (error) {
		console.error('Document upload error:', error);
		return {
			success: false,
			error: `문서 업로드 중 오류가 발생했습니다: ${error}`,
		};
	}
};

// 파일 삭제
export const deleteFile = async (
	bucket: string,
	path: string
): Promise<FileUploadResult> => {
	try {
		const { error } = await supabase.storage
			.from(bucket)
			.remove([path]);

		if (error) {
			console.error('Supabase delete error:', error);
			return {
				success: false,
				error: `삭제 실패: ${error.message}`,
			};
		}

		return {
			success: true,
		};
	} catch (error) {
		console.error('File delete error:', error);
		return {
			success: false,
			error: `파일 삭제 중 오류가 발생했습니다: ${error}`,
		};
	}
};

// 파일 목록 조회
export const listFiles = async (
	bucket: string,
	folder: string
): Promise<{ success: boolean; files?: any[]; error?: string }> => {
	try {
		const { data, error } = await supabase.storage
			.from(bucket)
			.list(folder);

		if (error) {
			console.error('Supabase list error:', error);
			return {
				success: false,
				error: `파일 목록 조회 실패: ${error.message}`,
			};
		}

		return {
			success: true,
			files: data,
		};
	} catch (error) {
		console.error('File list error:', error);
		return {
			success: false,
			error: `파일 목록 조회 중 오류가 발생했습니다: ${error}`,
		};
	}
};
