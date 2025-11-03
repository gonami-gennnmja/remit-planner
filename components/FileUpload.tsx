import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

interface FileUploadProps {
  onFileSelect: (file: any) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
  documentType?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  acceptedTypes = ["pdf", "doc", "docx", "jpg", "png"],
  maxFiles = 5,
  documentType = "other",
}) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);

  const handleFilePick = async () => {
    try {
      setUploading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];

      // 파일 타입 검증
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      if (fileExtension && !acceptedTypes.includes(fileExtension)) {
        Alert.alert(
          "지원하지 않는 파일 형식",
          `지원되는 형식: ${acceptedTypes.join(", ")}`
        );
        return;
      }

      // 파일 크기 검증 (10MB 제한)
      if (file.size && file.size > 10 * 1024 * 1024) {
        Alert.alert("파일 크기 초과", "파일 크기는 10MB를 초과할 수 없습니다.");
        return;
      }

      // 파일 정보 생성
      const fileData = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.name,
        fileUrl: file.uri,
        filePath: file.uri,
        fileType: fileExtension || "unknown",
        fileSize: file.size || 0,
        documentType: documentType,
        description: "",
      };

      // 선택된 파일 목록에 추가
      const newFiles = [...selectedFiles, fileData].slice(0, maxFiles);
      setSelectedFiles(newFiles);
      onFileSelect(fileData);
    } catch (error) {
      console.error("Error picking file:", error);
      Alert.alert("오류", "파일 선택 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf":
        return "document-text-outline";
      case "doc":
      case "docx":
        return "document-outline";
      case "jpg":
      case "jpeg":
      case "png":
        return "image-outline";
      default:
        return "document-outline";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = selectedFiles.filter((f) => f.id !== fileId);
    setSelectedFiles(updatedFiles);
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
        onPress={handleFilePick}
        disabled={uploading || selectedFiles.length >= maxFiles}
      >
        <Ionicons
          name={uploading ? "hourglass-outline" : "cloud-upload-outline"}
          size={24}
          color={uploading ? "#9ca3af" : "#3b82f6"}
        />
        <Text
          style={[
            styles.uploadButtonText,
            uploading && styles.uploadButtonTextDisabled,
          ]}
        >
          {uploading
            ? "업로드 중..."
            : selectedFiles.length >= maxFiles
            ? `최대 ${maxFiles}개 선택됨`
            : "파일 선택"}
        </Text>
      </Pressable>

      {selectedFiles.length > 0 && (
        <View style={styles.filesList}>
          {selectedFiles.map((file) => (
            <View key={file.id} style={styles.fileItem}>
              <Ionicons
                name={getFileIcon(file.fileType)}
                size={20}
                color="#3b82f6"
              />
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {file.fileName}
                </Text>
                <Text style={styles.fileSize}>
                  {formatFileSize(file.fileSize)}
                </Text>
              </View>
              <Pressable
                onPress={() => removeFile(file.id)}
                style={styles.removeButton}
              >
                <Ionicons name="close-circle" size={20} color="#ef4444" />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.helpText}>
        지원 형식: {acceptedTypes.join(", ")} (최대 {maxFiles}개, 10MB 이하)
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 2,
    borderColor: "#3b82f6",
    borderStyle: "dashed",
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  uploadButtonDisabled: {
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3b82f6",
    marginLeft: 8,
  },
  uploadButtonTextDisabled: {
    color: "#9ca3af",
  },
  helpText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 8,
  },
  filesList: {
    marginTop: 12,
    gap: 8,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  fileInfo: {
    flex: 1,
    gap: 4,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1e40af",
  },
  fileSize: {
    fontSize: 12,
    color: "#6b7280",
  },
  removeButton: {
    padding: 4,
  },
});
