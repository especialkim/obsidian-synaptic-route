# Synaptic Route

Synaptic Route는 Synaptic PKM을 위한 도구 모음입니다. 2년간의 개인 지식 관리(PKM) 경험을 바탕으로, 효율적인 지식 관리와 연결을 위한 다양한 도구들을 제공하는 것을 목표로 합니다.
Synaptic Route로 동작 가능한 지식관리 시스템을 경험해보세요.

## 주요 기능

- **키워드 시각화**: 현재 파일 또는 전체 파일 기준 키워드 워드 클라우드, 차트(막대, 파이, 폴라, 레이더), 테이블 형식 지원
  - **유연한 키워드 추출**: 태그, 파일명 접두사/접미사, 정규표현식 기반 키워드 추출
  - **Lucy Zettelkasten 워크플로우 지원**: 문헌 노트와 영구 노트 간의 연결 시각화
  - **테마 지원**: 라이트/다크 모드 지원
  - **스크린샷 캡처**: 시각화된 결과를 이미지로 캡처하여 클립보드에 저장
  - **Style Settings 지원**: Style Settings 플러그인을 통한 스타일 옵션 지원
- 기능 추가 예정...

## 사용법

코드블록에 다음과 같이 작성하여 사용합니다:

```SynapticRoute
Type: WordCloud|Chart|Table
ChartType: Bar|Pie|Polar|Radar
Global: true|false
MaxItem: <숫자>
MaxRandomItem: <숫자>
Theme: Dark|Light
```

### 옵션 설명

- **Type**: 시각화 유형 (기본값: WordCloud)
- **ChartType**: 'Chart' 선택 시 차트 유형 (기본값: Bar)
- **Global**: 전체 노트 포함 여부 (기본값: false)
- **MaxItem**: 표시할 최대 항목 수 (기본값: 30)
- **MaxRandomItem**: MaxItem 초과 시 포함할 랜덤 항목 수 (기본값: 5)
- **Theme**: 시각적 테마 (기본값: Dark)

## 설정

### 플러그인 설정

플러그인 설정에서 다음 항목들을 구성할 수 있습니다:

1. **키워드 선별 방식**
   - 태그 기반
   - 파일명 접두사/접미사
   - 정규표현식

2. **Lucy Zettelkasten 옵션**
   - 문헌 노트 선별 방식
   - 영구 노트 선별 방식

3. **필터링 옵션**
   - 제외할 폴더 경로
   - 제외할 태그
   - 제외할 파일명 패턴

### Style Settings

[Style Settings](https://github.com/mgmeyers/obsidian-style-settings) 플러그인을 통해 다음과 같은 스타일 설정이 가능합니다:

- **테마 연동**: 현재 사용 중인 Obsidian 테마의 스타일 속성을 자동으로 적용
- **(권장)커스텀 스타일**: 플러그인 고유의 스타일 설정 지원

## 설치

1. Obsidian의 설정에서 커뮤니티 플러그인으로 이동
2. "Synaptic Route" 검색
3. 설치 및 활성화
4. (선택사항) Style Settings 플러그인 설치로 추가 커스터마이징

## 지원

- 버그 리포트나 기능 제안은 GitHub 이슈를 통해 해주세요
- 문의사항: [@Facilitate4U](https://x.com/Facilitate4U)