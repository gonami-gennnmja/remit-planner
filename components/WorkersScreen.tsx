import { Theme } from "@/constants/Theme";
import {
  BankInfo,
  detectBankFromAccount,
  formatAccountNumber,
  KOREAN_BANKS,
} from "@/utils/bankUtils";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface Worker {
  id: string;
  name: string;
  phone: string;
  bankAccount: string;
  bankInfo?: BankInfo;
  hourlyWage: number;
  taxWithheld: boolean;
  workTags: string[];
  schedules: string[];
  scheduleDetails?: Array<{
    id: string;
    title: string;
    date: string;
    description: string;
    category: string;
  }>;
  scheduleWages: Array<{
    scheduleTitle: string;
    hourlyWage: number;
    workHours: number;
    totalPay: number;
  }>;
}

interface WorkersScreenProps {
  schedules: any[];
  allWorkers?: any[];
  onAddWorker?: (worker: any) => void;
  onUpdateWorker?: (workerId: string, updates: any) => void;
  onBackPress?: () => void;
}

export default function WorkersScreen({
  schedules,
  allWorkers = [],
  onAddWorker,
  onUpdateWorker,
  onBackPress,
}: WorkersScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);

  // 근로자 추가/수정용 폼 상태
  const [workerForm, setWorkerForm] = useState({
    name: "",
    phone: "",
    bankAccount: "",
    hourlyWage: "",
    taxWithheld: true,
    selectedBankCode: "",
  });

  const [detectedBank, setDetectedBank] = useState<BankInfo | null>(null);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [showScheduleDetailModal, setShowScheduleDetailModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);

  // 계좌번호 변경 시 은행 자동 감지
  useEffect(() => {
    if (workerForm.bankAccount) {
      const bank = detectBankFromAccount(workerForm.bankAccount);
      setDetectedBank(bank);
      if (bank) {
        setWorkerForm((prev) => ({ ...prev, selectedBankCode: bank.code }));
        setShowBankPicker(false);
      } else {
        setShowBankPicker(true);
      }
    } else {
      setDetectedBank(null);
      setShowBankPicker(false);
    }
  }, [workerForm.bankAccount]);

  // 모든 근로자들을 처리 (allWorkers 우선, 없으면 schedules에서 추출)
  const processedWorkers = useMemo(() => {
    if (allWorkers.length > 0) {
      // allWorkers가 있으면 그것을 사용하고, schedules에서 참여 일정 정보 추가
      return allWorkers.map((worker: any) => {
        const bankInfo = detectBankFromAccount(worker.bankAccount);

        // 해당 근로자가 참여한 스케줄 찾기
        const participatedSchedules = schedules
          .filter((schedule) =>
            schedule.workers?.some(
              (workerInfo: any) => workerInfo.worker.id === worker.id
            )
          )
          .map((schedule) => ({
            id: schedule.id,
            title: schedule.title,
            date: schedule.date,
            description: schedule.description,
            category: schedule.category,
          }));

        return {
          id: worker.id,
          name: worker.name,
          phone: worker.phone,
          bankAccount: formatAccountNumber(worker.bankAccount),
          bankInfo: bankInfo,
          hourlyWage: worker.hourlyWage,
          taxWithheld: worker.taxWithheld,
          workTags: [],
          schedules: participatedSchedules.map((s) => s.title),
          scheduleDetails: participatedSchedules,
          scheduleWages: [],
        };
      });
    } else {
      // allWorkers가 없으면 기존 로직 사용
      const workerMap = new Map<string, Worker>();

      schedules.forEach((schedule) => {
        schedule.workers?.forEach((workerInfo: any) => {
          const workerId = workerInfo.worker.id;
          if (!workerMap.has(workerId)) {
            // 은행 정보 감지
            const bankInfo = detectBankFromAccount(
              workerInfo.worker.bankAccount
            );

            workerMap.set(workerId, {
              id: workerId,
              name: workerInfo.worker.name,
              phone: workerInfo.worker.phone,
              bankAccount: formatAccountNumber(workerInfo.worker.bankAccount),
              bankInfo: bankInfo,
              hourlyWage: workerInfo.worker.hourlyWage,
              taxWithheld: workerInfo.worker.taxWithheld,
              workTags: [],
              schedules: [],
              scheduleWages: [],
            });
          }

          // 스케줄 정보 추가
          const worker = workerMap.get(workerId)!;
          if (!worker.schedules.includes(schedule.title)) {
            worker.schedules.push(schedule.title);

            // 일정별 시급 계산
            const workHours = workerInfo.periods.reduce(
              (total: number, period: any) => {
                const start = new Date(period.start);
                const end = new Date(period.end);
                return (
                  total + (end.getTime() - start.getTime()) / (1000 * 60 * 60)
                ); // 시간 단위
              },
              0
            );

            const totalPay = workerInfo.worker.hourlyWage * workHours;

            worker.scheduleWages.push({
              scheduleTitle: schedule.title,
              hourlyWage: workerInfo.worker.hourlyWage,
              workHours: workHours,
              totalPay: totalPay,
            });
          }
        });
      });

      return Array.from(workerMap.values());
    }
  }, [allWorkers, schedules]);

  // 검색 필터링
  const filteredWorkers = useMemo(() => {
    if (!searchQuery.trim()) return processedWorkers;

    const query = searchQuery.toLowerCase();
    return processedWorkers.filter(
      (worker) =>
        worker.name.toLowerCase().includes(query) ||
        worker.phone.includes(query)
    );
  }, [processedWorkers, searchQuery]);

  const addWorkTag = (workerId: string) => {
    if (!newTag.trim()) return;

    // 실제로는 여기서 데이터베이스 업데이트
    Alert.alert("태그 추가", `${newTag} 태그가 추가되었습니다.`);
    setNewTag("");
  };

  const removeWorkTag = (workerId: string, tag: string) => {
    Alert.alert("태그 제거", `${tag} 태그가 제거되었습니다.`);
  };

  const openWorkerDetail = (worker: Worker) => {
    setSelectedWorker(worker);
    setIsEditMode(true);
    setWorkerForm({
      name: worker.name,
      phone: worker.phone,
      bankAccount: worker.bankAccount,
      hourlyWage: worker.hourlyWage.toString(),
      taxWithheld: worker.taxWithheld,
    });
    setShowWorkerModal(true);
  };

  const handleScheduleTagPress = (scheduleTitle: string, worker: Worker) => {
    // 해당 스케줄의 상세 정보 찾기
    const scheduleDetail = worker.scheduleDetails?.find(
      (s) => s.title === scheduleTitle
    );
    if (scheduleDetail) {
      setSelectedSchedule(scheduleDetail);
      setShowScheduleDetailModal(true);
    }
  };

  const openAddWorker = () => {
    setIsEditMode(false);
    setWorkerForm({
      name: "",
      phone: "",
      bankAccount: "",
      hourlyWage: "",
      taxWithheld: true,
      selectedBankCode: "",
    });
    setDetectedBank(null);
    setShowBankPicker(false);
    setShowAddWorkerModal(true);
  };

  const handleSaveWorker = () => {
    if (
      !workerForm.name ||
      !workerForm.phone ||
      !workerForm.bankAccount ||
      !workerForm.hourlyWage
    ) {
      Alert.alert("오류", "모든 필드를 입력해주세요.");
      return;
    }

    // 은행이 감지되지 않고 사용자도 선택하지 않은 경우
    if (!detectedBank && !workerForm.selectedBankCode) {
      Alert.alert("오류", "은행을 선택해주세요.");
      return;
    }

    const selectedBank =
      detectedBank ||
      KOREAN_BANKS.find((b) => b.code === workerForm.selectedBankCode);

    if (isEditMode && selectedWorker) {
      // 수정 모드
      const updates = {
        name: workerForm.name,
        phone: workerForm.phone,
        bankAccount: workerForm.bankAccount,
        bankInfo: selectedBank,
        hourlyWage: parseInt(workerForm.hourlyWage),
        taxWithheld: workerForm.taxWithheld,
      };

      if (onUpdateWorker) {
        onUpdateWorker(selectedWorker.id, updates);
      }

      Alert.alert("저장 완료", `${workerForm.name}님의 정보가 수정되었습니다.`);
      setShowWorkerModal(false);
    } else {
      // 추가 모드
      const newWorker = {
        id: `w${Date.now()}`,
        name: workerForm.name,
        phone: workerForm.phone,
        bankAccount: workerForm.bankAccount,
        bankInfo: selectedBank,
        hourlyWage: parseInt(workerForm.hourlyWage),
        taxWithheld: workerForm.taxWithheld,
      };

      if (onAddWorker) {
        onAddWorker(newWorker);
      }

      Alert.alert("추가 완료", `${workerForm.name}님이 추가되었습니다.`);
      setShowAddWorkerModal(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onBackPress}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>근로자 관리</Text>
        <Pressable style={styles.addButton} onPress={openAddWorker}>
          <Ionicons name="add" size={24} color="white" />
        </Pressable>
      </View>

      {/* 검색 바 */}
      <View style={styles.searchContainer}>
        <Text style={styles.workerCountText}>
          총 {processedWorkers.length}명의 근로자
        </Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="이름 또는 전화번호로 검색..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </Pressable>
          )}
        </View>
      </View>

      {/* 근로자 목록 */}
      <ScrollView style={styles.workersList}>
        {filteredWorkers.map((worker) => (
          <Pressable
            key={worker.id}
            style={styles.workerCard}
            onPress={() => openWorkerDetail(worker)}
          >
            <View style={styles.workerInfo}>
              <View style={styles.workerHeader}>
                <Text style={styles.workerName}>{worker.name}</Text>
                <View style={styles.workerStatus}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: worker.taxWithheld
                          ? "#10b981"
                          : "#f59e0b",
                      },
                    ]}
                  />
                  <Text style={styles.statusText}>
                    {worker.taxWithheld ? "세금공제" : "일반"}
                  </Text>
                </View>
              </View>

              <Text style={styles.workerPhone}>📞 {worker.phone}</Text>
              <Text style={styles.workerBank}>
                🏦{" "}
                {worker.bankInfo
                  ? `${worker.bankInfo.shortName} ${worker.bankAccount}`
                  : worker.bankAccount}
              </Text>
              <Text style={styles.workerWage}>
                💰 {worker.hourlyWage.toLocaleString()}원/시간
              </Text>

              {/* 참여한 스케줄들 */}
              <View style={styles.schedulesContainer}>
                <Text style={styles.schedulesLabel}>참여 일정:</Text>
                <View style={styles.schedulesList}>
                  {worker.schedules.map((schedule, index) => (
                    <Pressable
                      key={index}
                      style={styles.scheduleTag}
                      onPress={() => handleScheduleTagPress(schedule, worker)}
                    >
                      <Text style={styles.scheduleTagText}>{schedule}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* 작업 태그들 */}
              {worker.workTags.length > 0 && (
                <View style={styles.tagsContainer}>
                  <Text style={styles.tagsLabel}>작업 태그:</Text>
                  <View style={styles.tagsList}>
                    {worker.workTags.map((tag, index) => (
                      <View key={index} style={styles.workTag}>
                        <Text style={styles.workTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>
        ))}

        {filteredWorkers.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>
              {searchQuery
                ? "검색 결과가 없습니다"
                : "등록된 근로자가 없습니다"}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 근로자 상세 모달 */}
      <Modal
        visible={showWorkerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWorkerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedWorker && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedWorker.name}</Text>
                  <Pressable
                    onPress={() => setShowWorkerModal(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color="#6b7280" />
                  </Pressable>
                </View>

                <ScrollView style={styles.modalBody}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>이름</Text>
                    <TextInput
                      style={styles.detailInput}
                      value={workerForm.name}
                      onChangeText={(text) =>
                        setWorkerForm({ ...workerForm, name: text })
                      }
                      placeholder="이름"
                    />
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>전화번호</Text>
                    <TextInput
                      style={styles.detailInput}
                      value={workerForm.phone}
                      onChangeText={(text) =>
                        setWorkerForm({ ...workerForm, phone: text })
                      }
                      placeholder="010-0000-0000"
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>계좌번호</Text>
                    <View style={styles.accountInputContainer}>
                      {detectedBank ? (
                        <View style={styles.bankLabel}>
                          <Text style={styles.bankLabelText}>
                            {detectedBank.shortName}
                          </Text>
                        </View>
                      ) : workerForm.selectedBankCode ? (
                        <View style={styles.bankLabel}>
                          <Text style={styles.bankLabelText}>
                            {KOREAN_BANKS.find(
                              (b) => b.code === workerForm.selectedBankCode
                            )?.shortName || "은행"}
                          </Text>
                        </View>
                      ) : null}
                      <TextInput
                        style={[
                          styles.detailInput,
                          (detectedBank || workerForm.selectedBankCode) &&
                            styles.detailInputWithBank,
                        ]}
                        value={workerForm.bankAccount}
                        onChangeText={(text) =>
                          setWorkerForm({ ...workerForm, bankAccount: text })
                        }
                        placeholder="110-1234-5678"
                        keyboardType="number-pad"
                      />
                    </View>
                    {!detectedBank &&
                      workerForm.bankAccount &&
                      !workerForm.selectedBankCode && (
                        <View style={styles.bankSelectContainer}>
                          <Text style={styles.bankHintWarning}>
                            ⚠️ 은행을 자동으로 감지할 수 없습니다. 선택해주세요:
                          </Text>
                          {Platform.OS === "web" ? (
                            <select
                              style={{
                                width: "100%",
                                padding: 10,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: "#d1d5db",
                                fontSize: 14,
                              }}
                              value={workerForm.selectedBankCode}
                              onChange={(e) =>
                                setWorkerForm({
                                  ...workerForm,
                                  selectedBankCode: e.target.value,
                                })
                              }
                            >
                              <option value="">은행 선택...</option>
                              {KOREAN_BANKS.map((bank) => (
                                <option key={bank.code} value={bank.code}>
                                  {bank.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <Picker
                              selectedValue={workerForm.selectedBankCode}
                              onValueChange={(value) =>
                                setWorkerForm({
                                  ...workerForm,
                                  selectedBankCode: value,
                                })
                              }
                              style={styles.picker}
                            >
                              <Picker.Item label="은행 선택..." value="" />
                              {KOREAN_BANKS.map((bank) => (
                                <Picker.Item
                                  key={bank.code}
                                  label={bank.name}
                                  value={bank.code}
                                />
                              ))}
                            </Picker>
                          )}
                        </View>
                      )}
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>시급</Text>
                    <TextInput
                      style={styles.detailInput}
                      value={workerForm.hourlyWage}
                      onChangeText={(text) =>
                        setWorkerForm({
                          ...workerForm,
                          hourlyWage: text.replace(/[^0-9]/g, ""),
                        })
                      }
                      placeholder="50000"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>세금공제 여부</Text>
                    <View style={styles.taxButtonsContainer}>
                      <Pressable
                        style={[
                          styles.taxButton,
                          workerForm.taxWithheld && styles.taxButtonActive,
                        ]}
                        onPress={() =>
                          setWorkerForm({ ...workerForm, taxWithheld: true })
                        }
                      >
                        <Text
                          style={[
                            styles.taxButtonText,
                            workerForm.taxWithheld &&
                              styles.taxButtonTextActive,
                          ]}
                        >
                          Y
                        </Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.taxButton,
                          !workerForm.taxWithheld && styles.taxButtonActive,
                        ]}
                        onPress={() =>
                          setWorkerForm({ ...workerForm, taxWithheld: false })
                        }
                      >
                        <Text
                          style={[
                            styles.taxButtonText,
                            !workerForm.taxWithheld &&
                              styles.taxButtonTextActive,
                          ]}
                        >
                          N
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>일정별 시급</Text>
                    <View style={styles.scheduleWagesList}>
                      {selectedWorker.scheduleWages.map(
                        (scheduleWage, index) => (
                          <View key={index} style={styles.scheduleWageItem}>
                            <View style={styles.scheduleWageHeader}>
                              <Text style={styles.scheduleWageTitle}>
                                {scheduleWage.scheduleTitle}
                              </Text>
                              <Text style={styles.scheduleWageHours}>
                                {scheduleWage.workHours.toFixed(1)}시간
                              </Text>
                            </View>
                            <View style={styles.scheduleWageDetails}>
                              <Text style={styles.scheduleWageRate}>
                                시급: {scheduleWage.hourlyWage.toLocaleString()}
                                원
                              </Text>
                              <Text style={styles.scheduleWageTotal}>
                                총액: {scheduleWage.totalPay.toLocaleString()}원
                              </Text>
                            </View>
                          </View>
                        )
                      )}
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>참여 일정</Text>
                    <View style={styles.schedulesList}>
                      {selectedWorker.schedules.map((schedule, index) => (
                        <View key={index} style={styles.scheduleTag}>
                          <Text style={styles.scheduleTagText}>{schedule}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </ScrollView>

                {/* 저장 버튼 */}
                <View style={styles.modalFooter}>
                  <Pressable
                    style={styles.saveButton}
                    onPress={handleSaveWorker}
                  >
                    <Text style={styles.saveButtonText}>저장</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* 근로자 추가 모달 */}
      <Modal
        visible={showAddWorkerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddWorkerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>근로자 추가</Text>
              <Pressable
                onPress={() => setShowAddWorkerModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>이름 *</Text>
                <TextInput
                  style={styles.detailInput}
                  value={workerForm.name}
                  onChangeText={(text) =>
                    setWorkerForm({ ...workerForm, name: text })
                  }
                  placeholder="이름을 입력하세요"
                />
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>전화번호 *</Text>
                <TextInput
                  style={styles.detailInput}
                  value={workerForm.phone}
                  onChangeText={(text) =>
                    setWorkerForm({ ...workerForm, phone: text })
                  }
                  placeholder="010-0000-0000"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>계좌번호 *</Text>
                <View style={styles.accountInputContainer}>
                  {detectedBank ? (
                    <View style={styles.bankLabel}>
                      <Text style={styles.bankLabelText}>
                        {detectedBank.shortName}
                      </Text>
                    </View>
                  ) : workerForm.selectedBankCode ? (
                    <View style={styles.bankLabel}>
                      <Text style={styles.bankLabelText}>
                        {KOREAN_BANKS.find(
                          (b) => b.code === workerForm.selectedBankCode
                        )?.shortName || "은행"}
                      </Text>
                    </View>
                  ) : null}
                  <TextInput
                    style={[
                      styles.detailInput,
                      (detectedBank || workerForm.selectedBankCode) &&
                        styles.detailInputWithBank,
                    ]}
                    value={workerForm.bankAccount}
                    onChangeText={(text) =>
                      setWorkerForm({ ...workerForm, bankAccount: text })
                    }
                    placeholder="110-1234-5678"
                    keyboardType={
                      Platform.OS === "web" ? "default" : "number-pad"
                    }
                  />
                </View>
                {!detectedBank &&
                  workerForm.bankAccount &&
                  !workerForm.selectedBankCode && (
                    <View style={styles.bankSelectContainer}>
                      <Text style={styles.bankHintWarning}>
                        ⚠️ 은행을 자동으로 감지할 수 없습니다. 선택해주세요:
                      </Text>
                      {Platform.OS === "web" ? (
                        <select
                          style={{
                            width: "100%",
                            padding: 10,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: "#d1d5db",
                            fontSize: 14,
                          }}
                          value={workerForm.selectedBankCode}
                          onChange={(e) =>
                            setWorkerForm({
                              ...workerForm,
                              selectedBankCode: e.target.value,
                            })
                          }
                        >
                          <option value="">은행 선택...</option>
                          {KOREAN_BANKS.map((bank) => (
                            <option key={bank.code} value={bank.code}>
                              {bank.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Picker
                          selectedValue={workerForm.selectedBankCode}
                          onValueChange={(value) =>
                            setWorkerForm({
                              ...workerForm,
                              selectedBankCode: value,
                            })
                          }
                          style={styles.picker}
                        >
                          <Picker.Item label="은행 선택..." value="" />
                          {KOREAN_BANKS.map((bank) => (
                            <Picker.Item
                              key={bank.code}
                              label={bank.name}
                              value={bank.code}
                            />
                          ))}
                        </Picker>
                      )}
                    </View>
                  )}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>시급 *</Text>
                <TextInput
                  style={styles.detailInput}
                  value={workerForm.hourlyWage}
                  onChangeText={(text) =>
                    setWorkerForm({
                      ...workerForm,
                      hourlyWage: text.replace(/[^0-9]/g, ""),
                    })
                  }
                  placeholder="50000"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>세금공제 여부</Text>
                <View style={styles.taxButtonsContainer}>
                  <Pressable
                    style={[
                      styles.taxButton,
                      workerForm.taxWithheld && styles.taxButtonActive,
                    ]}
                    onPress={() =>
                      setWorkerForm({ ...workerForm, taxWithheld: true })
                    }
                  >
                    <Text
                      style={[
                        styles.taxButtonText,
                        workerForm.taxWithheld && styles.taxButtonTextActive,
                      ]}
                    >
                      Y
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.taxButton,
                      !workerForm.taxWithheld && styles.taxButtonActive,
                    ]}
                    onPress={() =>
                      setWorkerForm({ ...workerForm, taxWithheld: false })
                    }
                  >
                    <Text
                      style={[
                        styles.taxButtonText,
                        !workerForm.taxWithheld && styles.taxButtonTextActive,
                      ]}
                    >
                      N
                    </Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>

            {/* 추가 버튼 */}
            <View style={styles.modalFooter}>
              <Pressable style={styles.saveButton} onPress={handleSaveWorker}>
                <Text style={styles.saveButtonText}>추가</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 스케줄 상세 모달 */}
      <Modal
        visible={showScheduleDetailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowScheduleDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedSchedule && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {selectedSchedule.title}
                  </Text>
                  <Pressable
                    onPress={() => setShowScheduleDetailModal(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color="#6b7280" />
                  </Pressable>
                </View>

                <ScrollView style={styles.modalBody}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>날짜</Text>
                    <Text style={styles.detailValue}>
                      {selectedSchedule.date}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>설명</Text>
                    <Text style={styles.detailValue}>
                      {selectedSchedule.description}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>카테고리</Text>
                    <Text style={styles.detailValue}>
                      {selectedSchedule.category}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>참여 근로자</Text>
                    <View style={styles.participantList}>
                      {schedules
                        .find((s) => s.id === selectedSchedule.id)
                        ?.workers?.map((workerInfo: any, index: number) => (
                          <View key={index} style={styles.participantItem}>
                            <Text style={styles.participantName}>
                              {workerInfo.worker.name}
                            </Text>
                            <Text style={styles.participantPhone}>
                              {workerInfo.worker.phone}
                            </Text>
                            <Text style={styles.participantWage}>
                              {workerInfo.worker.hourlyWage.toLocaleString()}
                              원/시간
                            </Text>
                          </View>
                        ))}
                    </View>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    backgroundColor: "#1e40af",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.success,
    justifyContent: "center",
    alignItems: "center",
    ...Theme.shadows.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
  },
  searchContainer: {
    padding: Theme.spacing.xl,
  },
  workerCountText: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: Theme.spacing.md,
    fontWeight: "500",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    ...Theme.shadows.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: Theme.spacing.md,
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.primary,
  },
  workersList: {
    flex: 1,
    paddingHorizontal: Theme.spacing.xl,
  },
  workerCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    ...Theme.shadows.sm,
  },
  workerInfo: {
    flex: 1,
  },
  workerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  workerName: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
  },
  workerStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: Theme.borderRadius.sm,
    marginRight: Theme.spacing.xs,
  },
  statusText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
  },
  workerPhone: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.xs,
  },
  workerBank: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.xs,
  },
  workerWage: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.md,
  },
  schedulesContainer: {
    marginBottom: Theme.spacing.sm,
  },
  schedulesLabel: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.xs,
  },
  schedulesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Theme.spacing.xs,
  },
  scheduleTag: {
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
    marginRight: Theme.spacing.xs,
    marginBottom: Theme.spacing.xs,
  },
  scheduleTagText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  participantList: {
    marginTop: Theme.spacing.sm,
  },
  participantItem: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.primary,
  },
  participantName: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  participantPhone: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
    marginBottom: 2,
  },
  participantWage: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.success,
    fontWeight: Theme.typography.weights.medium,
  },
  tagsContainer: {
    marginBottom: Theme.spacing.sm,
  },
  tagsLabel: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.xs,
  },
  tagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Theme.spacing.xs,
  },
  workTag: {
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
  },
  workTagText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  removeTagButton: {
    marginLeft: Theme.spacing.xs,
    padding: Theme.spacing.xs,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.secondary,
    marginTop: Theme.spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Theme.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.lg,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border.light,
  },
  modalTitle: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
  },
  modalCloseButton: {
    padding: Theme.spacing.xs,
  },
  modalBody: {
    padding: Theme.spacing.xl,
  },
  detailSection: {
    marginBottom: Theme.spacing.xl,
  },
  detailLabel: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.sm,
  },
  detailValue: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.primary,
  },
  tagsInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Theme.spacing.md,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Theme.colors.border.medium,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    fontSize: Theme.typography.sizes.sm,
  },
  addTagButton: {
    backgroundColor: Theme.colors.success,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.sm,
    marginLeft: Theme.spacing.sm,
  },
  scheduleWagesList: {
    marginTop: Theme.spacing.sm,
  },
  scheduleWageItem: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.primary,
  },
  scheduleWageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.xs,
  },
  scheduleWageTitle: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    flex: 1,
  },
  scheduleWageHours: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: Theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.sm,
  },
  scheduleWageDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  scheduleWageRate: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
  },
  scheduleWageTotal: {
    fontSize: Theme.typography.sizes.xs,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.success,
  },
  detailInput: {
    borderWidth: 1,
    borderColor: Theme.colors.border.medium,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.primary,
    backgroundColor: Theme.colors.background,
  },
  bankHint: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.success,
    marginTop: Theme.spacing.xs,
    fontWeight: Theme.typography.weights.medium,
  },
  bankHintSuccess: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.success,
    marginTop: Theme.spacing.xs,
    fontWeight: Theme.typography.weights.semibold,
  },
  bankHintWarning: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.warning,
    marginTop: Theme.spacing.xs,
    marginBottom: Theme.spacing.sm,
    fontWeight: Theme.typography.weights.medium,
  },
  bankSelectContainer: {
    marginTop: Theme.spacing.sm,
  },
  picker: {
    borderWidth: 1,
    borderColor: Theme.colors.border.medium,
    borderRadius: Theme.borderRadius.md,
  },
  accountInputContainer: {
    flexDirection: "column",
    gap: Theme.spacing.sm,
  },
  bankLabel: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    alignSelf: "flex-start",
    minWidth: 80,
    alignItems: "center",
  },
  bankLabelText: {
    color: Theme.colors.text.inverse,
    fontSize: Theme.typography.sizes.xs,
    fontWeight: Theme.typography.weights.semibold,
  },
  detailInputWithBank: {
    // 은행 라벨과 분리되었으므로 기본 스타일 사용
  },
  taxButtonsContainer: {
    flexDirection: "row",
    gap: Theme.spacing.md,
  },
  taxButton: {
    flex: 1,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 2,
    borderColor: Theme.colors.border.light,
    backgroundColor: Theme.colors.surface,
    alignItems: "center",
  },
  taxButtonActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.surface,
  },
  taxButtonText: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.secondary,
  },
  taxButtonTextActive: {
    color: Theme.colors.primary,
  },
  modalFooter: {
    padding: Theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border.light,
  },
  saveButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: "center",
  },
  saveButtonText: {
    color: Theme.colors.text.inverse,
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
  },
});
