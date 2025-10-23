import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  placeholder: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
  }>;
  selectedId?: string;
  onSelect: (id: string) => void;
  emptyMessage?: string;
}

export default function SearchModal({
  visible,
  onClose,
  title,
  placeholder,
  searchQuery,
  onSearchChange,
  items,
  selectedId,
  onSelect,
  emptyMessage = "검색 결과가 없습니다",
}: SearchModalProps) {
  const handleSelect = (id: string) => {
    onSelect(id);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={styles.container}
          onPress={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </Pressable>
          </View>

          {/* 검색창 */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#9ca3af"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={placeholder}
              value={searchQuery}
              onChangeText={onSearchChange}
              autoFocus
            />
          </View>

          {/* 리스트 */}
          <ScrollView
            style={styles.listContainer}
            showsVerticalScrollIndicator={false}
          >
            {items.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>{emptyMessage}</Text>
              </View>
            ) : (
              items.map((item) => (
                <Pressable
                  key={item.id}
                  style={[
                    styles.listItem,
                    selectedId === item.id && styles.selectedItem,
                  ]}
                  onPress={() => handleSelect(item.id)}
                >
                  <View style={styles.itemContent}>
                    <Text
                      style={[
                        styles.itemTitle,
                        selectedId === item.id && styles.selectedItemTitle,
                      ]}
                    >
                      {item.title}
                    </Text>
                    {item.subtitle && (
                      <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                    )}
                  </View>
                  {selectedId === item.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#3b82f6"
                    />
                  )}
                </Pressable>
              ))
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxHeight: "70%",
    minHeight: 300,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginVertical: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    fontSize: 16,
    color: "#374151",
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  selectedItem: {
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    marginHorizontal: -8,
    paddingHorizontal: 8,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  selectedItemTitle: {
    color: "#3b82f6",
    fontWeight: "600",
  },
  itemSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 12,
  },
});
