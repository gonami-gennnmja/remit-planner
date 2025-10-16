import WorkersScreen from "@/components/WorkersScreen";
import { Theme } from "@/constants/Theme";
import { Schedule } from "@/models/types";
import dayjs from "dayjs";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

export default function WorkersScreenPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [allWorkers, setAllWorkers] = useState<any[]>([]);

  // 근로자 추가 함수
  const handleAddWorker = (newWorker: any) => {
    console.log("새 근로자 추가:", newWorker);
    setAllWorkers((prev) => [...prev, newWorker]);
    Alert.alert("성공", `${newWorker.name}님이 추가되었습니다.`);
  };

  // 근로자 수정 함수
  const handleUpdateWorker = (workerId: string, updates: any) => {
    console.log("근로자 수정:", workerId, updates);
    setAllWorkers((prev) =>
      prev.map((worker) =>
        worker.id === workerId ? { ...worker, ...updates } : worker
      )
    );
    Alert.alert("성공", "근로자 정보가 수정되었습니다.");
  };

  useEffect(() => {
    const today = dayjs().format("YYYY-MM-DD");
    const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DD");

    const testSchedules: Schedule[] = [
      {
        id: "1",
        title: "수학 과외",
        startDate: today,
        endDate: today,
        description: "고등학교 2학년 수학 과외",
        category: "education",
        workers: [
          {
            worker: {
              id: "w1",
              name: "김선생",
              phone: "010-1234-5678",
              bankAccount: "110-1234-5678",
              hourlyWage: 50000,
              taxWithheld: true,
            },
            periods: [
              {
                id: "p1",
                start: `${today}T14:00:00+09:00`,
                end: `${today}T16:00:00+09:00`,
              },
            ],
            paid: false,
          },
        ],
      },
      {
        id: "2",
        title: "영어 회화",
        startDate: today,
        endDate: today,
        description: "성인 영어 회화 수업",
        category: "education",
        workers: [
          {
            worker: {
              id: "w2",
              name: "Sarah Johnson",
              phone: "010-9876-5432",
              bankAccount: "3333-12-3456789",
              hourlyWage: 80000,
              taxWithheld: false,
            },
            periods: [
              {
                id: "p2",
                start: `${today}T19:00:00+09:00`,
                end: `${today}T21:00:00+09:00`,
              },
            ],
            paid: false,
          },
        ],
      },
      {
        id: "3",
        title: "프로젝트 회의",
        startDate: tomorrow,
        endDate: tomorrow,
        description: "웹 개발 프로젝트 진행 회의",
        category: "meeting",
        workers: [
          {
            worker: {
              id: "w3",
              name: "이개발",
              phone: "010-5555-1234",
              bankAccount: "1002-123-456789",
              hourlyWage: 100000,
              taxWithheld: true,
            },
            periods: [
              {
                id: "p3",
                start: `${tomorrow}T10:00:00+09:00`,
                end: `${tomorrow}T12:00:00+09:00`,
              },
            ],
            paid: false,
          },
        ],
      },
    ];

    setSchedules(testSchedules);
    const initialWorkers = testSchedules.flatMap((schedule) =>
      schedule.workers.map((workerInfo) => workerInfo.worker)
    );
    setAllWorkers(initialWorkers);
  }, []);

  return (
    <View style={styles.container}>
      <WorkersScreen
        schedules={schedules}
        allWorkers={allWorkers}
        onAddWorker={handleAddWorker}
        onUpdateWorker={handleUpdateWorker}
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
