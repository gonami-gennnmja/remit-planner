import CommonHeader from "@/components/CommonHeader";
import { FileUpload } from "@/components/FileUpload";
import { database } from "@/database/supabaseRepository";
import { ContractDocument, ScheduleContract } from "@/models/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface ContractModalProps {
  visible: boolean;
  onClose: () => void;
  scheduleId: string;
  contractDirection: "sent" | "received";
  onContractSaved?: (contract: ScheduleContract) => void;
}

export const ContractModal: React.FC<ContractModalProps> = ({
  visible,
  onClose,
  scheduleId,
  contractDirection,
  onContractSaved,
}) => {
  const [contractData, setContractData] = useState({
    contractType: "written" as "written" | "verbal" | "text",
    contractAmount: "",
    contractContent: "",
    contractStatus: "draft" as
      | "draft"
      | "sent"
      | "received"
      | "approved"
      | "rejected",
  });

  const [attachments, setAttachments] = useState<ContractDocument[]>([]);
  const [loading, setLoading] = useState(false);
  // missing selectors' states
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showStatusSelector, setShowStatusSelector] = useState(false);

  useEffect(() => {
    if (visible) {
      // 모달이 열릴 때 초기화
      setContractData({
        contractType: "written",
        contractAmount: "",
        contractContent: "",
        contractStatus: contractDirection === "sent" ? "draft" : "received",
      });
      setAttachments([]);
    }
  }, [visible, contractDirection]);

  const handleSave = async () => {
    if (!contractData.contractAmount) {
      Alert.alert("오류", "계약금액을 입력해주세요.");
      return;
    }

    if (
      contractData.contractType !== "written" &&
      !contractData.contractContent
    ) {
      Alert.alert("오류", "계약 내용을 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const contractId = `contract_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const contract: ScheduleContract = {
        id: contractId,
        scheduleId,
        contractType: contractData.contractType,
        contractDirection,
        contractAmount: parseInt(contractData.contractAmount.replace(/,/g, "")),
        contractContent: contractData.contractContent || undefined,
        contractStatus: contractData.contractStatus,
        sentDate:
          contractDirection === "sent" ? new Date().toISOString() : undefined,
        receivedDate:
          contractDirection === "received"
            ? new Date().toISOString()
            : undefined,
      };

      await database.createScheduleContract(contract);

      // 첨부파일 저장
      for (const attachment of attachments) {
        await database.createContractDocument({
          ...attachment,
          contractId,
        });
      }

      // 스케줄의 계약금액 업데이트
      await database.updateSchedule(scheduleId, {
        contractAmount: contract.contractAmount,
      });

      Alert.alert("성공", "계약서가 저장되었습니다.");
      onContractSaved?.(contract);
      onClose();
    } catch (error) {
      console.error("Error saving contract:", error);
      Alert.alert("오류", "계약서 저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (file: ContractDocument) => {
    setAttachments((prev) => [...prev, file]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatAmount = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, "");
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <CommonHeader
          title={contractDirection === "sent" ? "계약서 작성" : "계약서 수신"}
          leftButton={{ icon: "close", onPress: onClose }}
          rightButton={{
            icon: "checkmark",
            onPress: handleSave,
            disabled: loading,
          }}
        />

        <ScrollView
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* 계약 타입 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>계약 타입</Text>
            <Pressable
              onPress={() => setShowTypeSelector(true)}
              disabled={loading}
              style={[styles.pickerContainer, styles.selectorButton]}
            >
              <Text style={styles.selectorText}>
                {contractData.contractType === "written"
                  ? "작성 계약서"
                  : contractData.contractType === "verbal"
                  ? "구두 계약"
                  : "텍스트 계약"}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#6b7280" />
            </Pressable>
          </View>

          {/* 계약금액 입력 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>계약금액 *</Text>
            <TextInput
              style={styles.input}
              value={contractData.contractAmount}
              onChangeText={(text) =>
                setContractData({
                  ...contractData,
                  contractAmount: formatAmount(text),
                })
              }
              placeholder="계약금액을 입력하세요"
              keyboardType="numeric"
            />
          </View>

          {/* 계약 내용 (구두/텍스트 계약 시) */}
          {contractData.contractType !== "written" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>계약 내용 *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={contractData.contractContent}
                onChangeText={(text) =>
                  setContractData({ ...contractData, contractContent: text })
                }
                placeholder="계약 내용을 입력하세요"
                multiline
                numberOfLines={4}
              />
            </View>
          )}

          {/* 계약 상태 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>계약 상태</Text>
            <Pressable
              onPress={() => setShowStatusSelector(true)}
              disabled={loading}
              style={[styles.pickerContainer, styles.selectorButton]}
            >
              <Text style={styles.selectorText}>
                {contractData.contractStatus === "draft"
                  ? "초안"
                  : contractData.contractStatus === "sent"
                  ? "발송"
                  : contractData.contractStatus === "received"
                  ? "수신"
                  : contractData.contractStatus === "approved"
                  ? "승인"
                  : "거절"}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#6b7280" />
            </Pressable>
          </View>

          {/* 첨부파일 업로드 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>첨부파일</Text>
            <FileUpload
              onFileSelect={handleFileUpload}
              acceptedTypes={["pdf", "doc", "docx", "jpg", "png"]}
              maxFiles={5}
              documentType="contract"
            />

            {/* 첨부파일 목록 */}
            {attachments.length > 0 && (
              <View style={styles.attachmentsList}>
                {attachments.map((attachment, index) => (
                  <View key={index} style={styles.attachmentItem}>
                    <Ionicons name="document-outline" size={20} color="#666" />
                    <Text style={styles.attachmentName} numberOfLines={1}>
                      {attachment.fileName}
                    </Text>
                    <Pressable onPress={() => removeAttachment(index)}>
                      <Ionicons name="close-circle" size={20} color="#ef4444" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
        {/* 선택 시트들 */}
        <Modal
          visible={showTypeSelector}
          animationType="fade"
          transparent
          onRequestClose={() => setShowTypeSelector(false)}
        >
          <Pressable
            style={styles.backdrop}
            onPress={() => setShowTypeSelector(false)}
          >
            <View style={styles.sheet}>
              {[
                { label: "작성 계약서", value: "written" },
                { label: "구두 계약", value: "verbal" },
                { label: "텍스트 계약", value: "text" },
              ].map((opt) => (
                <Pressable
                  key={opt.value}
                  style={styles.sheetItem}
                  onPress={() => {
                    setContractData({
                      ...contractData,
                      contractType: opt.value as any,
                    });
                    setShowTypeSelector(false);
                  }}
                >
                  <Text style={styles.sheetItemText}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>

        <Modal
          visible={showStatusSelector}
          animationType="fade"
          transparent
          onRequestClose={() => setShowStatusSelector(false)}
        >
          <Pressable
            style={styles.backdrop}
            onPress={() => setShowStatusSelector(false)}
          >
            <View style={styles.sheet}>
              {[
                { label: "초안", value: "draft" },
                { label: "발송", value: "sent" },
                { label: "수신", value: "received" },
                { label: "승인", value: "approved" },
                { label: "거절", value: "rejected" },
              ].map((opt) => (
                <Pressable
                  key={opt.value}
                  style={styles.sheetItem}
                  onPress={() => {
                    setContractData({
                      ...contractData,
                      contractStatus: opt.value as any,
                    });
                    setShowStatusSelector(false);
                  }}
                >
                  <Text style={styles.sheetItemText}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>
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
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    // 겹침 방지
    zIndex: 10,
    elevation: 10,
  },
  picker: {
    height: 50,
  },
  selectorButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorText: {
    fontSize: 16,
    color: "#111827",
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
    height: 100,
    textAlignVertical: "top",
  },
  attachmentsList: {
    marginTop: 12,
  },
  attachmentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  attachmentName: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#374151",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  sheetItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  sheetItemText: {
    fontSize: 16,
    color: "#111827",
  },
});
