import { Theme } from "@/constants/Theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={Theme.colors.text.primary}
          />
        </Pressable>
        <Text style={styles.headerTitle}>개인정보처리방침</Text>
      </View>

      {/* 내용 */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.updateDate}>최종 수정일: 2025년 1월 21일</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 개인정보의 처리 목적</Text>
          <Text style={styles.sectionContent}>
            리밋 플래너(이하 "회사")는 다음의 목적을 위하여 개인정보를
            처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는
            이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법
            제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
            {"\n\n"}
            1) 회원 가입 및 관리{"\n"}
            　• 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증,
            회원자격 유지·관리, 서비스 부정이용 방지 목적으로 개인정보를
            처리합니다.{"\n\n"}
            2) 서비스 제공{"\n"}
            　• 근로자 정보 관리, 스케줄 관리, 급여 계산, 거래처 관리 등의
            서비스 제공을 목적으로 개인정보를 처리합니다.{"\n\n"}
            3) 서비스 개선 및 개발{"\n"}
            　• 신규 서비스 개발 및 맞춤 서비스 제공, 서비스 개선을 위한 통계
            분석을 목적으로 개인정보를 처리합니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 수집하는 개인정보의 항목</Text>
          <Text style={styles.sectionContent}>
            회사는 회원가입, 서비스 이용 등을 위해 아래와 같은 개인정보를
            수집하고 있습니다.{"\n\n"}
            1) 필수 수집 항목{"\n"}
            　• 이메일 주소{"\n"}
            　• 비밀번호 (암호화 저장){"\n"}
            　• 이름{"\n\n"}
            2) 선택 수집 항목{"\n"}
            　• 사업자 정보 (사업자명, 사업자등록번호, 주소, 전화번호){"\n"}
            　• 프로필 사진{"\n\n"}
            3) 서비스 이용 시 수집되는 정보{"\n"}
            　• 근로자 정보 (이름, 연락처, 계좌정보){"\n"}
            　• 스케줄 정보 (일정, 근무시간){"\n"}
            　• 거래처 정보 (상호명, 연락처, 주소){"\n\n"}
            4) 자동으로 수집되는 정보{"\n"}
            　• 서비스 이용 기록, 접속 로그, IP 주소, 기기 정보
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            3. 개인정보의 처리 및 보유 기간
          </Text>
          <Text style={styles.sectionContent}>
            1. 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터
            개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서
            개인정보를 처리·보유합니다.{"\n\n"}
            2. 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:{"\n"}
            　• 회원 가입 및 관리: 회원 탈퇴 시까지{"\n"}
            　• 서비스 이용 데이터: 회원 탈퇴 후 1년{"\n"}
            　• 부정 이용 기록: 1년{"\n\n"}
            3. 관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우에는 해당
            수사·조사 종료 시까지 보관합니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. 개인정보의 제3자 제공</Text>
          <Text style={styles.sectionContent}>
            회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한
            범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등
            개인정보 보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를
            제3자에게 제공합니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. 개인정보의 파기</Text>
          <Text style={styles.sectionContent}>
            1. 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가
            불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.
            {"\n\n"}
            2. 개인정보 파기의 절차 및 방법은 다음과 같습니다:{"\n"}
            　• 파기절차: 파기 사유가 발생한 개인정보를 선정하고, 개인정보
            보호책임자의 승인을 받아 개인정보를 파기합니다.{"\n"}
            　• 파기방법: 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적
            방법을 사용합니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            6. 정보주체의 권리·의무 및 행사방법
          </Text>
          <Text style={styles.sectionContent}>
            1. 정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련
            권리를 행사할 수 있습니다:{"\n"}
            　• 개인정보 열람 요구{"\n"}
            　• 오류 등이 있을 경우 정정 요구{"\n"}
            　• 삭제 요구{"\n"}
            　• 처리정지 요구{"\n\n"}
            2. 제1항에 따른 권리 행사는 회사에 대해 서면, 전화, 전자우편 등을
            통하여 하실 수 있으며 회사는 이에 대해 지체 없이 조치하겠습니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            7. 개인정보의 안전성 확보 조치
          </Text>
          <Text style={styles.sectionContent}>
            회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고
            있습니다:{"\n\n"}
            1. 관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육 등{"\n\n"}
            2. 기술적 조치: 개인정보처리시스템 등의 접근권한 관리,
            접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치
            {"\n\n"}
            3. 물리적 조치: 전산실, 자료보관실 등의 접근통제
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. 개인정보 보호책임자</Text>
          <Text style={styles.sectionContent}>
            회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보
            처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와
            같이 개인정보 보호책임자를 지정하고 있습니다.{"\n\n"}▶ 개인정보
            보호책임자{"\n"}
            　• 이름: 리밋 플래너 운영팀{"\n"}
            　• 이메일: privacy@remit-planner.com{"\n\n"}※ 개인정보 보호
            담당부서로 연결됩니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. 개인정보 처리방침의 변경</Text>
          <Text style={styles.sectionContent}>
            이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른
            변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일
            전부터 공지사항을 통하여 고지할 것입니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. 데이터 저장 위치</Text>
          <Text style={styles.sectionContent}>
            회사는 이용자의 개인정보를 Supabase(미국)의 클라우드 서버에
            저장합니다. Supabase는 SOC 2 Type 2 인증을 받은 안전한 클라우드
            서비스입니다.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            본 방침은 2025년 1월 21일부터 적용됩니다.
          </Text>
          <Text style={styles.footerText}>리밋 플래너 운영팀</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border.light,
    backgroundColor: Theme.colors.card,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    marginRight: Theme.spacing.md,
  },
  headerTitle: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.xl,
  },
  updateDate: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.tertiary,
    marginBottom: Theme.spacing.xl,
    textAlign: "right",
  },
  section: {
    marginBottom: Theme.spacing.xxl,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.md,
  },
  sectionContent: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.secondary,
    lineHeight: 24,
  },
  footer: {
    marginTop: Theme.spacing.xxl,
    paddingTop: Theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border.light,
    alignItems: "center",
    gap: Theme.spacing.sm,
  },
  footerText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.tertiary,
  },
});
