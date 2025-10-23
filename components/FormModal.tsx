import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

interface FormModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSave?: () => void;
  onDelete?: () => void;
  saveText?: string;
  deleteText?: string;
  showSave?: boolean;
  showDelete?: boolean;
}

export default function FormModal({
  visible,
  onClose,
  title,
  children,
  onSave,
  onDelete,
  saveText = "저장",
  deleteText = "삭제",
  showSave = true,
  showDelete = false,
}: FormModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.headerButtons}>
              {showDelete && onDelete && (
                <Pressable style={styles.deleteButton} onPress={onDelete}>
                  <Ionicons name="trash" size={20} color="#ef4444" />
                </Pressable>
              )}
              <Pressable style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </Pressable>
            </View>
          </View>

          {/* 내용 */}
          <View style={styles.content}>{children}</View>

          {/* 하단 버튼 */}
          {showSave && onSave && (
            <View style={styles.footer}>
              <Pressable style={styles.saveButton} onPress={onSave}>
                <Text style={styles.saveButtonText}>{saveText}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxHeight: "90%",
    minHeight: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  deleteButton: {
    padding: 8,
    marginRight: 8,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  saveButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
