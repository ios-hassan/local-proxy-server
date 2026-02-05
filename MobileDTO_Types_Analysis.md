# MobileDTO 타입 분석

> 경로: `Services/MobileService/Sources/MobileServiceImpl/DTO/`

---

## 1. 최상위 구조 타입

| 타입 | 설명 |
|------|------|
| `MobileDTO` | API 응답 루트 (screen, body, nextPageToken) |
| `ScreenDTO` | 화면 구조 (id, type, header, body, modal, log) |
| `BodyDTO` | 화면 본문 (id, url, components, cta, log, nextPageToken) |
| `ModalDTO` | 모달 구조 (BodyDTO와 유사) |
| `MobileComponentDTO` | 컴포넌트 래퍼 (type + 각 타입별 데이터) |

---

## 2. 컴포넌트 타입 (MobileComponentTypeDTO)

### Navigation/Tab
- `navigation`
- `navigationBeta`
- `tabContainer`
- `tab`
- `anchorTabRow`

### Header
- `titleHeader`
- `emphasizedTitleHeader`
- `imageTitleHeader`
- `filterTitleHeader`
- `sectionHeader`

### Card 계열
- `card`
- `cardContainer`
- `imageCard`
- `videoCard`
- `reviewCard`
- `moreCard`
- `odsCard`
- `odsCardContainer`

### Product 계열
- `product`
- `productContainer`
- `productSnippet`

### Container 계열
| 타입 | 설명 |
|------|------|
| `chipContainer` | 칩 컨테이너 |
| `boxButtonContainer` | 박스 버튼 컨테이너 |
| `thumbnailLinkContainer` | 썸네일 링크 컨테이너 |
| `projectContainer` | 프로젝트 컨테이너 |
| `expertContainer` | 전문가 컨테이너 |
| `fixedHeightHorizontalContainer` | 고정 높이 가로 컨테이너 |
| `waterfallContainer` | 워터폴 컨테이너 |
| `stylingShotContainer` | 스타일링샷 컨테이너 |
| `contentBannerContainer` | 콘텐츠 배너 컨테이너 |
| `contentFilterContainer` | 콘텐츠 필터 컨테이너 |
| `contentShortcutRow` | 콘텐츠 숏컷 행 |
| `reviewCardContainer` | 리뷰 카드 컨테이너 |
| `reviewFilterContainer` | 리뷰 필터 컨테이너 |
| `reviewDealOptionContainer` | 리뷰 딜 옵션 컨테이너 |
| `reviewSelectedFilterContainer` | 리뷰 선택 필터 컨테이너 |
| `commerceQuickFilterContainer` | 커머스 퀵필터 컨테이너 |
| `commerceFilterSideSheetContainer` | 커머스 필터 사이드시트 |
| `commerceFilterGroupContainer` | 커머스 필터 그룹 컨테이너 |
| `commerceFilterHeaderContainer` | 커머스 필터 헤더 컨테이너 |
| `commerceFilterOrderContainer` | 커머스 필터 정렬 컨테이너 |
| `commerceCategoryFilterContainer` | 커머스 카테고리 필터 컨테이너 |
| `colorSelectorContainer` | 색상 선택 컨테이너 |
| `filterSelectorContainer` | 필터 선택 컨테이너 |
| `openFilterContainer` | 오픈 필터 컨테이너 |
| `popularKeywordContainer` | 인기 키워드 컨테이너 |
| `iconBoxKeywordContainer` | 아이콘박스 키워드 컨테이너 |
| `suggestedKeywordContainer` | 추천 키워드 컨테이너 |
| `relatedKeywordContainer` | 연관 키워드 컨테이너 |

### Button 계열
- `linkButton`
- `iconButton`
- `textButton`
- `boxButton`
- `customBoxButton`
- `imageSearchEntryButton`

### Filter 계열
- `chip`
- `removableChip`
- `commerceFilter`
- `commerceFilterBar`
- `commerceQuickFilter`
- `commerceFilterValue`
- `commerceFilterOrder`
- `commerceCategoryFilter`
- `reviewFilter`
- `reviewFilterBar`
- `filterSelector`
- `colorSelector`
- `openFilter`

### Content 계열
- `brand`
- `expert`
- `apartment`
- `suggest`
- `project`
- `advice`
- `post`
- `contentDocument`
- `stylingShot`
- `contentShortcut`
- `contentShortcutItem`
- `contentHeroBanner`
- `contentTextBanner`
- `richHashtag`
- `multimediaYoutube`

### Review 계열
- `review`
- `reviewUserInfo`
- `reviewPraise`
- `reviewDealOption`
- `totalRating`

### 기타 UI
- `image`
- `divider`
- `spacer`
- `avatar`
- `noResult`
- `plainText`
- `tag`
- `hashtag`
- `hashtagDescription`
- `floatingBanner`
- `adBanner`
- `imageWithTags`
- `objectDetectionOverlay`
- `detectionObject`
- `selectableCroppedImage`
- `linkView`
- `thumbnailLink`
- `userAction`
- `statusToggleRow`
- `expandableInfo`

---

## 3. 공통 기반 타입 (Foundation)

| 타입 | 용도 | 주요 필드 |
|------|------|----------|
| `ImageDTO` | 이미지 | style, url, width, height |
| `VideoDTO` | 비디오 | id, duration, videoUrl, thumbnail |
| `LinkDTO` | 링크/딥링크 | - |
| `LogDTO` | 로깅 데이터 | - |
| `InsetDTO` | 여백 | top, left, right, bottom |
| `BorderDTO` | 테두리 | width, color, radius |
| `ScrapDTO` | 스크랩 상태 | isScrap, contentType, contentId, scrapCount |
| `LikeDTO` | 좋아요 상태 | iconButton, contentId, contentType |
| `ODSIconDTO` | ODS 아이콘 | name, size, color |

---

## 4. 텍스트/스타일 타입

| 타입 | 용도 | 주요 필드 |
|------|------|----------|
| `PlainTextDTO` | 단순 텍스트 | description, attributes |
| `TypographyDTO` | 타이포그래피 | color, textStyle, weight, maxLines |
| `ButtonStyleDTO` | 버튼 스타일 | - |

---

## 5. 액션/인터랙션 타입

### ActionDTO
```swift
enum ActionDTO: String {
    case select
    case back
    case close
    case move
    case open
    case unknown
}
```

### ButtonActionDTO
```swift
struct ButtonActionDTO: Codable {
    var type: ButtonActionTypeDTO
    var url: String
    var contentTooltip: ContentTooltipDTO?
}
```

### ButtonActionTypeDTO
```swift
enum ButtonActionTypeDTO: String {
    case close
    case fetch
    case call
    case deeplink
    case openBottomSheet
    case closeAndFetch
    case contentTooltip
    case like
    case share
    case scrap
    case unknown
}
```

---

## 6. ODS(Ohouse Design System) 전용 타입

### ODS.Card

| 타입 | 설명 |
|------|------|
| `OdsCardDTO` | ODS 카드 (landingUrl, media, content) |
| `OdsCardContainerDTO` | ODS 카드 컨테이너 |
| `OdsCardMediaElementDTO` | 미디어 요소 enum |
| `OdsCardMediaAccessoryElementDTO` | 미디어 액세서리 enum |
| `OdsCardContentElementDTO` | 콘텐츠 요소 enum |

#### OdsCardMediaElementDTO 케이스
- `.gridThumbnail(GridThumbnailDataDTO)`
- `.thumbnail(ThumbnailDataDTO)`

#### OdsCardMediaAccessoryElementDTO 케이스
- `.scrapButton(ScrapButtonDataDTO)`
- `.writer(WriterAccessoryDataDTO)`
- `.badge(BadgeAccessoryDataDTO)`
- `.unknown`

#### OdsCardContentElementDTO 케이스
- `.text(TextDataDTO)`
- `.favoriteCount(FavoriteCountDataDTO)`
- `.viewAndScrap(ViewAndScrapDataDTO)`
- `.writerAndComments(WriterAndCommentsDataDTO)`
- `.discountAndPrice(DiscountAndPriceDataDTO)`
- `.ratingAndReviews(RatingAndReviewsDataDTO)`
- `.unknown`

### ODS.Badge
- `OdsSquareBadgeDTO`

### ODS.SectionHeader
- `SectionHeaderDTO`

---

## 7. 도메인별 특화 타입

### Commerce
| 타입 | 설명 |
|------|------|
| `CommerceFilterBarDTO` | 필터바 (totalCount, orderTextButton, filterBoxButton) |
| `CommerceQuickFilterDTO` | 퀵필터 (value, displayName, filterType) |
| `CommerceFilterDTO` | 필터 (id, displayName, filterValues, style, selectType) |
| `CommerceFilterValueDTO` | 필터 값 (value, displayName, isSelected) |
| `CommerceCategoryFilterDTO` | 카테고리 필터 |
| `CommerceFilterOrderDTO` | 정렬 필터 |
| `CommerceFilterSideSheetContainerDTO` | 사이드시트 컨테이너 |

### Review
| 타입 | 설명 |
|------|------|
| `ReviewDTO` | 리뷰 (id, user, orderInfo, cards, badges, comment, praiseInfo) |
| `ReviewCardDTO` | 리뷰 카드 (id, imageUrl, count, video) |
| `ReviewUserInfoDTO` | 리뷰 사용자 정보 |
| `ReviewPraiseDTO` | 리뷰 칭찬 (id, type, title, icon, count, isSelected) |
| `ReviewFilterDTO` | 리뷰 필터 (type: star/option) |
| `ReviewDealOptionDTO` | 리뷰 딜 옵션 |
| `TotalRatingDTO` | 총 평점 (reviewAverage, reviewCount) |

### Content
| 타입 | 설명 |
|------|------|
| `ContentDTO` | 콘텐츠 (id, contentType, mediaType, coverImages, user) |
| `PostDTO` | 포스트 (id, contentType, subCategory, coverImage) |
| `StylingShotDTO` | 스타일링샷 (imageWithTags, productSnippet) |
| `StylingShotContainerDTO` | 스타일링샷 컨테이너 |
| `ContentShortcutDTO` | 콘텐츠 숏컷 |
| `ContentHeroBannerDTO` | 히어로 배너 |
| `ContentTextBannerDTO` | 텍스트 배너 |

### Search
| 타입 | 설명 |
|------|------|
| `KeywordDTO` | 키워드 (text, link) |
| `PopularKeywordDTO` | 인기 키워드 (rank, imageUrl, name) |
| `IconBoxKeywordDTO` | 아이콘박스 키워드 (icon, name) |
| `SuggestedKeywordContainerDTO` | 추천 키워드 컨테이너 |
| `NoResultDTO` | 검색 결과 없음 (title, subtext, actionButton) |

---

## 8. 파일 구조

```
DTO/
├── MobileDTO.swift                    # 메인 DTO (최상위 + 대부분의 컴포넌트)
├── MobileDTO+Entity.swift             # Entity 변환
├── MobileDTO+SearchConverter+Old.swift
│
├── Common/
│   ├── MobileDTO+Common.swift         # AvatarDTO, DividerDTO
│   ├── Button/
│   │   └── MobileDTO+Common+Button.swift    # ButtonActionDTO, LinkButtonDTO
│   ├── Card/
│   │   └── MobileDTO+Common+Card.swift      # ImageCardDTO, VideoCardDTO
│   ├── Container/
│   │   └── MobileDTO+Common+Container.swift # FixedHeightHorizontalContainerDTO, WaterfallContainerDTO
│   ├── Foundation/
│   │   └── MobileDTO+Common+Foundation.swift # ImageDTO, VideoDTO, ScrapDTO, ODSIconDTO
│   ├── Layout/
│   │   └── MobileDTO+Common+Layout.swift    # InsetDTO
│   ├── Text/
│   │   └── MobileDTO+Common+Text.swift      # PlainTextDTO, TypographyDTO
│   ├── Filter/
│   │   └── MobileDTO+Common+Filter.swift
│   └── Expandableinfo/
│       └── MobileDTO+Common+Expandableinfo.swift
│
├── Component-base/
│   ├── MobileDTO+Component-base.swift       # ComponentTypeDTO enum
│   └── Log/
│       └── MobileDTO+Component-base+Log.swift
│
├── Content/
│   ├── MobileDTO+Content.swift
│   └── MobileDTO+ContentConverter.swift
│
├── Ods/
│   ├── MobileDTO+Ods.swift                  # ODS namespace
│   ├── Badge/
│   │   ├── MobileDTO+Ods+Badge.swift
│   │   └── Enum/
│   ├── Buttons/
│   │   └── MobileDTO+Ods+Buttons.swift
│   ├── Card/
│   │   ├── MobileDTO+Ods+Card.swift         # OdsCardDTO, OdsCardContainerDTO
│   │   ├── Config/
│   │   │   └── Element/
│   │   ├── Data/
│   │   │   └── Element/
│   │   └── Enums/
│   ├── Foundation/
│   │   ├── Colors/
│   │   ├── Icon/
│   │   └── Typography/
│   └── Sectionheader/
│
├── Commerce/
│   └── MobileDTO+Commerce.swift
│
└── Search/
    ├── MobileDTO+Search.swift
    └── MobileDTO+SearchConverter.swift
```

---

## 9. Preset 설계 시 참고사항

### 핵심 분류 기준
1. **구조 타입**: MobileDTO, ScreenDTO, BodyDTO, MobileComponentDTO
2. **컴포넌트 타입**: MobileComponentTypeDTO의 80여개 케이스
3. **Foundation 타입**: ImageDTO, VideoDTO, LinkDTO, InsetDTO 등
4. **스타일 타입**: TypographyDTO, ButtonStyleDTO, BorderDTO
5. **액션 타입**: ActionDTO, ButtonActionDTO

### 컴포넌트 카테고리
- Navigation (5개)
- Header (5개)
- Card (8개)
- Product (3개)
- Container (27개)
- Button (6개)
- Filter (13개)
- Content (15개)
- Review (5개)
- 기타 UI (21개)
