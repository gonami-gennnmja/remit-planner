import {
  deleteFile,
  FileUploadOptions,
  pickAndUploadDocument,
  pickAndUploadImage,
} from "@/utils/fileUpload";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface FileUploadProps {
  type: "image" | "document";
  currentUrl?: string;
  currentPath?: string;
  onUpload: (url: string, path: string) => void;
  onDelete?: () => void;
  options: FileUploadOptions;
  placeholder?: string;
  disabled?: boolean;
}

export default function FileUpload({
  type,
  currentUrl,
  currentPath,
  onUpload,
  onDelete,
  options,
  placeholder,
  disabled = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (disabled) return;

    setUploading(true);
    try {
      const result =
        type === "image"
          ? await pickAndUploadImage(options)
          : await pickAndUploadDocument(options);

      if (result.success && result.url && result.path) {
        onUpload(result.url, result.path);
      } else {
        Alert.alert(
          "업로드 실패",
          result.error || "파일 업로드에 실패했습니다."
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("오류", "파일 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (disabled || !currentPath) return;

    Alert.alert("파일 삭제", "이 파일을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          const result = await deleteFile(options.bucket, currentPath);
          if (result.success) {
            onDelete?.();
          } else {
            Alert.alert(
              "삭제 실패",
              result.error || "파일 삭제에 실패했습니다."
            );
          }
        },
      },
    ]);
  };

  const getPlaceholderText = () => {
    if (placeholder) return placeholder;
    return type === "image" ? "이미지를 선택하세요" : "문서를 선택하세요";
  };

  const getIconName = () => {
    if (type === "image") return "image-outline";
    return "document-outline";
  };

  return (
    <View style={styles.container}>
      {currentUrl ? (
        <View style={styles.filePreview}>
          {type === "image" ? (
            <Image source={{ uri: currentUrl }} style={styles.imagePreview} />
          ) : (
            <View style={styles.documentPreview}>
              <Ionicons name="document" size={40} color="#6b7280" />
              <Text style={styles.documentText}>문서 업로드됨</Text>
            </View>
          )}

          <View style={styles.fileActions}>
            <Pressable
              style={[styles.actionButton, styles.uploadButton]}
              onPress={handleUpload}
              disabled={disabled || uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="refresh" size={16} color="white" />
              )}
            </Pressable>

            <Pressable
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
              disabled={disabled}
            >
              <Ionicons name="trash" size={16} color="white" />
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          style={[styles.uploadArea, disabled && styles.uploadAreaDisabled]}
          onPress={handleUpload}
          disabled={disabled || uploading}
        >
          {uploading ? (
            <ActivityIndicator size="large" color="#6b7280" />
          ) : (
            <>
              <Ionicons name={getIconName()} size={40} color="#6b7280" />
              <Text style={styles.uploadText}>{getPlaceholderText()}</Text>
              <Text style={styles.uploadSubText}>
                {type === "image"
                  ? "JPG, PNG, GIF 지원"
                  : "PDF, DOC, XLS 등 지원"}
              </Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
    minHeight: 120,
  },
  uploadAreaDisabled: {
    opacity: 0.5,
  },
  uploadText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
    marginTop: 8,
  },
  uploadSubText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  filePreview: {
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    resizeMode: "cover",
  },
  documentPreview: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  documentText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
  },
  fileActions: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadButton: {
    backgroundColor: "#3b82f6",
  },
  deleteButton: {
    backgroundColor: "#ef4444",
  },
});
