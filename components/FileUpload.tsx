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

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
        onPress={handleFilePick}
        disabled={uploading}
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
          {uploading ? "업로드 중..." : "파일 선택"}
        </Text>
      </Pressable>

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
});
