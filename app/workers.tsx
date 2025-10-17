import WorkersScreen from "@/components/WorkersScreen";
import { Theme } from "@/constants/Theme";
import { getDatabase } from "@/database/platformDatabase";
import { Schedule } from "@/models/types";
import {
  logWorkerAdded,
  logWorkerDeleted,
  logWorkerUpdated,
} from "@/utils/activityLogger";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

export default function WorkersScreenPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [allWorkers, setAllWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // DB에서 근로자 로드
  const loadWorkersFromDB = async () => {
    try {
      const db = getDatabase();
      const workers = await db.getAllWorkers();
      console.log(`Loaded ${workers.length} workers from DB:`, workers);
      setAllWorkers(workers);
    } catch (error) {
      console.error("Failed to load workers from DB:", error);
      Alert.alert("오류", "근로자 데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 근로자 추가 함수 (DB 연동)
  const handleAddWorker = async (newWorker: any) => {
    try {
      console.log("새 근로자 추가:", newWorker);
      const db = getDatabase();

      // DB에 저장 (모든 필드 포함)
      await db.createWorker({
        id: newWorker.id,
        name: newWorker.name,
        phone: newWorker.phone,
        bankAccount: newWorker.bankAccount,
        hourlyWage: newWorker.hourlyWage,
        taxWithheld: newWorker.taxWithheld,
        memo: newWorker.memo || "",
        // 근무시간 관련 필드들 추가
        workStartDate: newWorker.workStartDate,
        workEndDate: newWorker.workEndDate,
        workHours: newWorker.workHours,
        workMinutes: newWorker.workMinutes,
        isFullPeriodWork: newWorker.isFullPeriodWork,
        isSameWorkHoursDaily: newWorker.isSameWorkHoursDaily,
        dailyWorkTimes: newWorker.dailyWorkTimes,
        defaultStartTime: newWorker.defaultStartTime,
        defaultEndTime: newWorker.defaultEndTime,
      });

      // 활동 기록
      await logWorkerAdded(
        newWorker.name,
        newWorker.phone,
        newWorker.hourlyWage
      );

      // State 업데이트
      setAllWorkers((prev) => [...prev, newWorker]);

      // DB에서 최신 데이터 다시 로드
      await loadWorkersFromDB();

      Alert.alert("성공", `${newWorker.name}님이 추가되었습니다.`);
    } catch (error) {
      console.error("Failed to add worker:", error);
      Alert.alert("오류", "근로자 추가에 실패했습니다.");
    }
  };

  // 근로자 수정 함수 (DB 연동)
  const handleUpdateWorker = async (workerId: string, updates: any) => {
    try {
      console.log("근로자 수정:", workerId, updates);
      const db = getDatabase();

      // DB에 저장 (모든 필드 포함)
      await db.updateWorker(workerId, {
        ...updates,
        // 근무시간 관련 필드들도 포함
        workStartDate: updates.workStartDate,
        workEndDate: updates.workEndDate,
        workHours: updates.workHours,
        workMinutes: updates.workMinutes,
        isFullPeriodWork: updates.isFullPeriodWork,
        isSameWorkHoursDaily: updates.isSameWorkHoursDaily,
        dailyWorkTimes: updates.dailyWorkTimes,
        defaultStartTime: updates.defaultStartTime,
        defaultEndTime: updates.defaultEndTime,
      });

      // 활동 기록
      const workerName =
        updates.name ||
        allWorkers.find((w) => w.id === workerId)?.name ||
        "근로자";
      await logWorkerUpdated(workerName);

      // State 업데이트
      setAllWorkers((prev) =>
        prev.map((worker) =>
          worker.id === workerId ? { ...worker, ...updates } : worker
        )
      );
      Alert.alert("성공", "근로자 정보가 수정되었습니다.");
    } catch (error) {
      console.error("Failed to update worker:", error);
      Alert.alert("오류", "근로자 정보 수정에 실패했습니다.");
    }
  };

  // 근로자 삭제 함수 (DB 연동)
  const handleDeleteWorker = async (workerId: string) => {
    try {
      console.log("=== handleDeleteWorker 시작 ===");
      console.log("근로자 삭제:", workerId);
      console.log("현재 allWorkers:", allWorkers);

      const db = getDatabase();
      console.log("DB 인스턴스:", db);

      // 삭제할 근로자 정보 가져오기
      const worker = allWorkers.find((w) => w.id === workerId);
      console.log("찾은 worker:", worker);

      if (!worker) {
        console.log("근로자를 찾을 수 없음");
        Alert.alert("오류", "근로자를 찾을 수 없습니다.");
        return;
      }

      console.log("DB에서 삭제 시작...");
      // DB에서 삭제
      await db.deleteWorker(workerId);
      console.log("DB에서 삭제 완료");

      console.log("활동 기록 시작...");
      // 활동 기록
      await logWorkerDeleted(worker.name);
      console.log("활동 기록 완료");

      console.log("State 업데이트 시작...");
      // State 업데이트
      setAllWorkers((prev) => {
        const filtered = prev.filter((w) => w.id !== workerId);
        console.log("필터링된 workers:", filtered);
        return filtered;
      });
      console.log("State 업데이트 완료");

      // DB에서 최신 데이터 다시 로드하여 UI 동기화
      console.log("DB에서 최신 데이터 다시 로드...");
      await loadWorkersFromDB();
      console.log("DB에서 최신 데이터 로드 완료");

      console.log(`Worker ${workerId} deleted successfully`);
      Alert.alert("성공", "근로자가 삭제되었습니다.");
    } catch (error) {
      console.error("Failed to delete worker:", error);
      Alert.alert("오류", "근로자 삭제에 실패했습니다.");
    }
  };

  useEffect(() => {
    // DB에서 근로자 로드
    loadWorkersFromDB();
  }, []);

  return (
    <View style={styles.container}>
      <WorkersScreen
        schedules={schedules}
        allWorkers={allWorkers}
        selectedScheduleId={null} // 근로자 관리에서는 특정 스케줄이 선택되지 않음
        onAddWorker={handleAddWorker}
        onUpdateWorker={handleUpdateWorker}
        onDeleteWorker={handleDeleteWorker}
        onBackPress={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
});
