import { useTheme } from "@/contexts/ThemeContext";
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
import CommonHeader from "../components/CommonHeader";
import FormModal from "../components/FormModal";
import SearchModal from "../components/SearchModal";
import { getDatabase } from "../database";
import { Client, Schedule } from "../models/types";

interface ClientDocument {
  id: string;
  clientId: string;
  fileName: string;
  fileUrl: string;
  filePath: string;
  fileType: string;
  fileSize?: number;
  uploadedAt: string;
}

interface ScheduleDocument {
  id: string;
  scheduleId: string;
  fileName: string;
  fileUrl: string;
  filePath: string;
  fileType: string;
  fileSize?: number;
  uploadedAt: string;
}

export default function FilesScreen() {
  const { colors } = useTheme();
  const [clients, setClients] = useState<Client[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [clientDocuments, setClientDocuments] = useState<ClientDocument[]>([]);
  const [scheduleDocuments, setScheduleDocuments] = useState<
    ScheduleDocument[]
  >([]);
  const [selectedTab, setSelectedTab] = useState<"client" | "schedule">(
    "client"
  );
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedSchedule, setSelectedSchedule] = useState<string>("");
  const [showClientModal, setShowClientModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  // 선택된 거래처나 스케줄이 변경될 때 문서 로드
  useEffect(() => {
    const loadDocuments = async () => {
      if (selectedClient) {
        try {
          const db = getDatabase();
          const clientDocs = await db.getClientDocuments(selectedClient);
          setClientDocuments(clientDocs);
        } catch (error) {
          console.error("Failed to load client documents:", error);
        }
      }
    };

    const loadScheduleDocuments = async () => {
      if (selectedSchedule) {
        try {
          const db = getDatabase();
          const scheduleDocs = await db.getScheduleDocuments(selectedSchedule);
          setScheduleDocuments(scheduleDocs);
        } catch (error) {
          console.error("Failed to load schedule documents:", error);
        }
      }
    };

    if (selectedTab === "client") {
      loadDocuments();
    } else {
      loadScheduleDocuments();
    }
  }, [selectedClient, selectedSchedule, selectedTab]);

  const loadData = async () => {
    try {
      const db = getDatabase();
      const [clientsData, schedulesData] = await Promise.all([
        db.getAllClients(),
        db.getAllSchedules(),
      ]);

      setClients(clientsData);
      setSchedules(schedulesData);

      // 선택된 거래처나 스케줄이 있으면 해당 문서들 로드
      if (selectedClient) {
        const clientDocs = await db.getClientDocuments(selectedClient);
        setClientDocuments(clientDocs);
      }
      if (selectedSchedule) {
        const scheduleDocs = await db.getScheduleDocuments(selectedSchedule);
        setScheduleDocuments(scheduleDocs);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getFileIcon = (fileType: string): string => {
    if (fileType.includes("pdf")) return "document-text";
    if (fileType.includes("image")) return "image";
    if (fileType.includes("word") || fileType.includes("doc"))
      return "document";
    if (fileType.includes("excel") || fileType.includes("sheet"))
      return "table";
    if (fileType.includes("powerpoint") || fileType.includes("presentation"))
      return "easel";
    return "document";
  };

  const handleUpload = () => {
    if (selectedTab === "client" && !selectedClient) {
      Alert.alert("알림", "거래처를 선택해주세요.");
      return;
    }
    if (selectedTab === "schedule" && !selectedSchedule) {
      Alert.alert("알림", "스케줄을 선택해주세요.");
      return;
    }
    setShowUploadModal(true);
  };

  const handleFileUpload = async () => {
    // TODO: 실제 파일 업로드 구현
    Alert.alert("알림", "파일 업로드 기능은 준비 중입니다.");
    setShowUploadModal(false);
  };

  // 필터링된 거래처 목록
  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(clientSearchQuery.toLowerCase())
  );

  // 필터링된 스케줄 목록
  const filteredSchedules = schedules.filter((schedule) =>
    schedule.title.toLowerCase().includes(scheduleSearchQuery.toLowerCase())
  );

  const handleDeleteDocument = (
    documentId: string,
    type: "client" | "schedule"
  ) => {
    Alert.alert("문서 삭제", "정말로 이 문서를 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            const db = getDatabase();
            if (type === "client") {
              await db.deleteClientDocument(documentId);
              setClientDocuments((prev) =>
                prev.filter((doc) => doc.id !== documentId)
              );
            } else {
              await db.deleteScheduleDocument(documentId);
              setScheduleDocuments((prev) =>
                prev.filter((doc) => doc.id !== documentId)
              );
            }
            Alert.alert("성공", "문서가 삭제되었습니다.");
          } catch (error) {
            console.error("Failed to delete document:", error);
            Alert.alert("오류", "문서 삭제에 실패했습니다.");
          }
        },
      },
    ]);
  };

  const renderClientDocuments = () => (
    <View style={styles.documentsContainer}>
      <View style={styles.uploadSection}>
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>거래처 선택:</Text>
          <Pressable
            style={styles.selectorButton}
            onPress={() => setShowClientModal(true)}
          >
            <Text style={styles.selectorButtonText}>
              {selectedClient
                ? clients.find((c) => c.id === selectedClient)?.name ||
                  "거래처 선택"
                : "거래처를 선택하세요"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </Pressable>
        </View>
        <Pressable style={styles.uploadButton} onPress={handleUpload}>
          <Ionicons name="cloud-upload" size={20} color="#fff" />
          <Text style={styles.uploadButtonText}>파일 업로드</Text>
        </Pressable>
      </View>

      <View style={styles.documentsList}>
        {clientDocuments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>업로드된 문서가 없습니다</Text>
          </View>
        ) : (
          clientDocuments.map((doc) => (
            <View key={doc.id} style={styles.documentItem}>
              <View style={styles.documentInfo}>
                <Ionicons
                  name={getFileIcon(doc.fileType)}
                  size={24}
                  color={colors.primary}
                />
                <View style={styles.documentDetails}>
                  <Text style={styles.documentName}>{doc.fileName}</Text>
                  <Text style={styles.documentMeta}>
                    {formatFileSize(doc.fileSize)} •{" "}
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <Pressable
                style={styles.deleteButton}
                onPress={() => handleDeleteDocument(doc.id, "client")}
              >
                <Ionicons name="trash" size={20} color="#ef4444" />
              </Pressable>
            </View>
          ))
        )}
      </View>
    </View>
  );

  const renderScheduleDocuments = () => (
    <View style={styles.documentsContainer}>
      <View style={styles.uploadSection}>
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>스케줄 선택:</Text>
          <Pressable
            style={styles.selectorButton}
            onPress={() => setShowScheduleModal(true)}
          >
            <Text style={styles.selectorButtonText}>
              {selectedSchedule
                ? schedules.find((s) => s.id === selectedSchedule)?.title ||
                  "스케줄 선택"
                : "스케줄을 선택하세요"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </Pressable>
        </View>
        <Pressable style={styles.uploadButton} onPress={handleUpload}>
          <Ionicons name="cloud-upload" size={20} color="#fff" />
          <Text style={styles.uploadButtonText}>파일 업로드</Text>
        </Pressable>
      </View>

      <View style={styles.documentsList}>
        {scheduleDocuments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>업로드된 문서가 없습니다</Text>
          </View>
        ) : (
          scheduleDocuments.map((doc) => (
            <View key={doc.id} style={styles.documentItem}>
              <View style={styles.documentInfo}>
                <Ionicons
                  name={getFileIcon(doc.fileType)}
                  size={24}
                  color={colors.primary}
                />
                <View style={styles.documentDetails}>
                  <Text style={styles.documentName}>{doc.fileName}</Text>
                  <Text style={styles.documentMeta}>
                    {formatFileSize(doc.fileSize)} •{" "}
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <Pressable
                style={styles.deleteButton}
                onPress={() => handleDeleteDocument(doc.id, "schedule")}
              >
                <Ionicons name="trash" size={20} color="#ef4444" />
              </Pressable>
            </View>
          ))
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <CommonHeader title="파일 관리" showBackButton />

      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, selectedTab === "client" && styles.activeTab]}
          onPress={() => setSelectedTab("client")}
        >
          <Ionicons
            name="business"
            size={20}
            color={selectedTab === "client" ? colors.primary : "#6b7280"}
          />
          <Text
            style={[
              styles.tabText,
              selectedTab === "client" && styles.activeTabText,
            ]}
          >
            거래처 문서
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, selectedTab === "schedule" && styles.activeTab]}
          onPress={() => setSelectedTab("schedule")}
        >
          <Ionicons
            name="calendar"
            size={20}
            color={selectedTab === "schedule" ? colors.primary : "#6b7280"}
          />
          <Text
            style={[
              styles.tabText,
              selectedTab === "schedule" && styles.activeTabText,
            ]}
          >
            스케줄 문서
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content}>
        {selectedTab === "client"
          ? renderClientDocuments()
          : renderScheduleDocuments()}
      </ScrollView>

      {/* 거래처 선택 모달 */}
      <SearchModal
        visible={showClientModal}
        onClose={() => {
          setShowClientModal(false);
          setClientSearchQuery("");
        }}
        title="거래처 선택"
        placeholder="거래처명으로 검색..."
        searchQuery={clientSearchQuery}
        onSearchChange={setClientSearchQuery}
        items={filteredClients.map((client) => ({
          id: client.id,
          title: client.name,
          subtitle: client.phone,
        }))}
        selectedId={selectedClient}
        onSelect={(id) => setSelectedClient(id)}
        emptyMessage="검색 결과가 없습니다"
      />

      {/* 스케줄 선택 모달 */}
      <SearchModal
        visible={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setScheduleSearchQuery("");
        }}
        title="스케줄 선택"
        placeholder="스케줄명으로 검색..."
        searchQuery={scheduleSearchQuery}
        onSearchChange={setScheduleSearchQuery}
        items={filteredSchedules.map((schedule) => ({
          id: schedule.id,
          title: schedule.title,
          subtitle: `${schedule.startDate} ~ ${schedule.endDate}`,
        }))}
        selectedId={selectedSchedule}
        onSelect={(id) => setSelectedSchedule(id)}
        emptyMessage="검색 결과가 없습니다"
      />

      {/* 파일 업로드 모달 */}
      <FormModal
        visible={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="파일 업로드"
        onSave={handleFileUpload}
        saveText="업로드"
        showDelete={false}
      >
        <Text style={styles.uploadModalText}>
          {selectedTab === "client"
            ? `거래처: ${
                clients.find((c) => c.id === selectedClient)?.name || ""
              }`
            : `스케줄: ${
                schedules.find((s) => s.id === selectedSchedule)?.title || ""
              }`}
        </Text>
        <Pressable style={styles.fileSelectButton}>
          <Ionicons name="folder-open" size={24} color={colors.primary} />
          <Text style={styles.fileSelectButtonText}>파일 선택</Text>
        </Pressable>
      </FormModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#eff6ff",
  },
  tabText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
    color: "#6b7280",
  },
  activeTabText: {
    color: "#3b82f6",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  documentsContainer: {
    flex: 1,
  },
  uploadSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  selectorContainer: {
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  uploadButton: {
    backgroundColor: "#3b82f6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  documentsList: {
    flex: 1,
  },
  documentItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  documentInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  documentDetails: {
    marginLeft: 12,
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 4,
  },
  documentMeta: {
    fontSize: 14,
    color: "#6b7280",
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 16,
  },
  uploadModalContent: {
    padding: 20,
  },
  uploadModalText: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 20,
    textAlign: "center",
  },
  fileSelectButton: {
    borderWidth: 2,
    borderColor: "#3b82f6",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    marginBottom: 20,
  },
  fileSelectButtonText: {
    fontSize: 16,
    color: "#3b82f6",
    marginTop: 8,
  },
  uploadConfirmButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  uploadConfirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  selectorButton: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  selectorButtonText: {
    fontSize: 16,
    color: "#374151",
    flex: 1,
  },
});
