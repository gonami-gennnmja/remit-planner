import { CommonHeader } from "@/components/CommonHeader";
import { database } from "@/database/supabaseRepository";
import { DocumentCategory } from "@/models/types";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface DocumentCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  category?: DocumentCategory | null;
  onSaved: () => void;
}

const COLOR_OPTIONS = [
  { name: "빨간색", value: "#ef4444" },
  { name: "파란색", value: "#3b82f6" },
  { name: "초록색", value: "#10b981" },
  { name: "주황색", value: "#f59e0b" },
  { name: "보라색", value: "#8b5cf6" },
  { name: "회색", value: "#6b7280" },
  { name: "핑크색", value: "#ec4899" },
  { name: "청록색", value: "#06b6d4" },
];

const ICON_OPTIONS = [
  { name: "문서", value: "document-outline" },
  { name: "계약서", value: "document-text-outline" },
  { name: "정보", value: "information-circle-outline" },
  { name: "안전", value: "shield-checkmark-outline" },
  { name: "장비", value: "construct-outline" },
  { name: "차트", value: "bar-chart-outline" },
  { name: "폴더", value: "folder-outline" },
  { name: "설정", value: "settings-outline" },
];

export const DocumentCategoryModal: React.FC<DocumentCategoryModalProps> = ({
  visible,
  onClose,
  category,
  onSaved,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    icon: "document-outline",
    sortOrder: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (category) {
        // 편집 모드
        setFormData({
          name: category.name,
          description: category.description || "",
          color: category.color,
          icon: category.icon,
          sortOrder: category.sortOrder,
        });
      } else {
        // 추가 모드
        setFormData({
          name: "",
          description: "",
          color: "#3b82f6",
          icon: "document-outline",
          sortOrder: 0,
        });
      }
    }
  }, [visible, category]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert("오류", "분류명을 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      if (category) {
        // 편집
        await database.updateDocumentCategory(category.id, formData);
        Alert.alert("성공", "분류가 수정되었습니다.");
      } else {
        // 추가
        const categoryId = `cat_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        await database.createDocumentCategory({
          id: categoryId,
          ...formData,
        });
        Alert.alert("성공", "분류가 추가되었습니다.");
      }
      onSaved();
    } catch (error) {
      console.error("Error saving category:", error);
      Alert.alert("오류", "분류 저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getIconName = (iconValue: string) => {
    const icon = ICON_OPTIONS.find((opt) => opt.value === iconValue);
    return icon?.name || "문서";
  };

  const getColorName = (colorValue: string) => {
    const color = COLOR_OPTIONS.find((opt) => opt.value === colorValue);
    return color?.name || "파란색";
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <CommonHeader
          title={category ? "분류 편집" : "분류 추가"}
          leftButton={{ icon: "close", onPress: onClose }}
          rightButton={{
            icon: "checkmark",
            onPress: handleSave,
            disabled: loading,
          }}
        />

        <ScrollView style={styles.content}>
          {/* 분류명 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>분류명 *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="분류명을 입력하세요"
              maxLength={20}
            />
          </View>

          {/* 설명 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>설명</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              placeholder="분류에 대한 설명을 입력하세요"
              multiline
              numberOfLines={3}
              maxLength={100}
            />
          </View>

          {/* 색상 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>색상</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.color}
                onValueChange={(value) =>
                  setFormData({ ...formData, color: value })
                }
                style={styles.picker}
              >
                {COLOR_OPTIONS.map((color) => (
                  <Picker.Item
                    key={color.value}
                    label={color.name}
                    value={color.value}
                  />
                ))}
              </Picker>
            </View>

            {/* 색상 미리보기 */}
            <View style={styles.colorPreview}>
              <View
                style={[
                  styles.colorCircle,
                  { backgroundColor: formData.color },
                ]}
              />
              <Text style={styles.colorPreviewText}>
                {getColorName(formData.color)}
              </Text>
            </View>
          </View>

          {/* 아이콘 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>아이콘</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.icon}
                onValueChange={(value) =>
                  setFormData({ ...formData, icon: value })
                }
                style={styles.picker}
              >
                {ICON_OPTIONS.map((icon) => (
                  <Picker.Item
                    key={icon.value}
                    label={icon.name}
                    value={icon.value}
                  />
                ))}
              </Picker>
            </View>

            {/* 아이콘 미리보기 */}
            <View style={styles.iconPreview}>
              <View
                style={[styles.iconCircle, { backgroundColor: formData.color }]}
              >
                <Ionicons
                  name={formData.icon as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color="#fff"
                />
              </View>
              <Text style={styles.iconPreviewText}>
                {getIconName(formData.icon)}
              </Text>
            </View>
          </View>

          {/* 정렬 순서 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>정렬 순서</Text>
            <TextInput
              style={styles.input}
              value={formData.sortOrder.toString()}
              onChangeText={(text) => {
                const order = parseInt(text) || 0;
                setFormData({ ...formData, sortOrder: order });
              }}
              placeholder="0"
              keyboardType="numeric"
            />
            <Text style={styles.helpText}>숫자가 작을수록 앞에 표시됩니다</Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1f2937",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  picker: {
    height: 50,
  },
  colorPreview: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  colorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  colorPreviewText: {
    fontSize: 14,
    color: "#374151",
  },
  iconPreview: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconPreviewText: {
    fontSize: 14,
    color: "#374151",
  },
  helpText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
});
