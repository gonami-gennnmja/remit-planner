import { CommonHeader } from "@/components/CommonHeader";
import { DocumentCategoryModal } from "@/components/DocumentCategoryModal";
import { database } from "@/database/supabaseRepository";
import { DocumentCategory } from "@/models/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export const DocumentCategoryScreen: React.FC = () => {
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<DocumentCategory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await database.getAllDocumentCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
      Alert.alert("오류", "분류 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowAddModal(true);
  };

  const handleEditCategory = (category: DocumentCategory) => {
    setEditingCategory(category);
    setShowAddModal(true);
  };

  const handleDeleteCategory = (category: DocumentCategory) => {
    Alert.alert("분류 삭제", `"${category.name}" 분류를 삭제하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await database.deleteDocumentCategory(category.id);
            await loadCategories();
            Alert.alert("성공", "분류가 삭제되었습니다.");
          } catch (error) {
            console.error("Error deleting category:", error);
            Alert.alert("오류", "분류 삭제 중 오류가 발생했습니다.");
          }
        },
      },
    ]);
  };

  const handleCategorySaved = () => {
    setShowAddModal(false);
    setEditingCategory(null);
    loadCategories();
  };

  const getCategoryIcon = (iconName: string) => {
    const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
      "document-outline": "document-outline",
      "document-text-outline": "document-text-outline",
      "information-circle-outline": "information-circle-outline",
      "shield-checkmark-outline": "shield-checkmark-outline",
      "construct-outline": "construct-outline",
      "bar-chart-outline": "bar-chart-outline",
      "folder-outline": "folder-outline",
    };
    return iconMap[iconName] || "document-outline";
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CommonHeader title="서류 분류 관리" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CommonHeader
        title="서류 분류 관리"
        rightButton={{ icon: "add", onPress: handleAddCategory }}
      />

      <ScrollView style={styles.content}>
        {categories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>분류가 없습니다</Text>
            <Text style={styles.emptyDescription}>
              새로운 서류 분류를 추가해보세요
            </Text>
            <Pressable style={styles.addButton} onPress={handleAddCategory}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>분류 추가</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.categoriesList}>
            {categories.map((category) => (
              <View key={category.id} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: category.color },
                    ]}
                  >
                    <Ionicons
                      name={getCategoryIcon(category.icon)}
                      size={24}
                      color="#fff"
                    />
                  </View>
                  <View style={styles.categoryDetails}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    {category.description && (
                      <Text style={styles.categoryDescription}>
                        {category.description}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.categoryActions}>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => handleEditCategory(category)}
                  >
                    <Ionicons name="create-outline" size={20} color="#3b82f6" />
                  </Pressable>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => handleDeleteCategory(category)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <DocumentCategoryModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        category={editingCategory}
        onSaved={handleCategorySaved}
      />
    </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  categoriesList: {
    gap: 12,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: "#6b7280",
  },
  categoryActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
});
