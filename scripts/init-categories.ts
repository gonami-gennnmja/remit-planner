/**
 * 기본 카테고리 초기화 스크립트
 * 
 * 실행 방법:
 * npx ts-node scripts/init-categories.ts
 */

import { getDatabase } from '../database/platformDatabase';

// 시스템 기본 카테고리 (교육, 업무만)
const defaultCategories = [
	{ id: 'cat-education', name: '교육', color: '#8b5cf6' },
	{ id: 'cat-work', name: '업무', color: '#06b6d4' },
];

async function initCategories() {
	try {
		console.log('🏷️ 카테고리 초기화 시작...');

		const db = getDatabase();

		// 기존 카테고리 확인
		const existingCategories = await db.getAllCategories();
		console.log(`📊 기존 카테고리 개수: ${existingCategories.length}`);

		// 기본 카테고리 추가
		for (const category of defaultCategories) {
			const exists = existingCategories.find(c => c.id === category.id);

			if (!exists) {
				await db.createCategory(category);
				console.log(`✅ 카테고리 추가됨: ${category.name} (${category.color})`);
			} else {
				console.log(`ℹ️  이미 존재: ${category.name}`);
			}
		}

		// 최종 확인
		const finalCategories = await db.getAllCategories();
		console.log(`\n🎉 카테고리 초기화 완료!`);
		console.log(`📊 전체 카테고리 개수: ${finalCategories.length}`);
		console.log('\n카테고리 목록:');
		finalCategories.forEach(cat => {
			console.log(`  - ${cat.name} (${cat.color})`);
		});

	} catch (error) {
		console.error('❌ 카테고리 초기화 실패:', error);
		throw error;
	}
}

// 실행
initCategories()
	.then(() => {
		console.log('\n✨ 완료!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('\n💥 오류 발생:', error);
		process.exit(1);
	});

