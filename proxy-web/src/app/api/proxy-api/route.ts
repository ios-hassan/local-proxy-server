import { NextRequest, NextResponse } from "next/server";

interface ProxyApiData {
  baseUrl: string;
  path: string;
  query?: string;
  body?: string;
  fakeResponse: string;
}

// 임시 저장소 (실제로는 DB 사용)
const apiList: ProxyApiData[] = [];

export async function POST(request: NextRequest) {
  try {
    const data: ProxyApiData = await request.json();

    // 필수 필드 검증
    if (!data.baseUrl || !data.path || !data.fakeResponse) {
      return NextResponse.json(
        { error: "baseUrl, path, fakeResponse는 필수입니다." },
        { status: 400 }
      );
    }

    apiList.push(data);

    return NextResponse.json(
      { message: "API가 성공적으로 저장되었습니다.", data },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "요청 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(apiList);
}
