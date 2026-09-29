import { NextRequest, NextResponse } from "next/server";
import { getAuthPayload } from "@backend/auth";
import {
  createTask,
  InvalidDescriptionError,
  InvalidStatusError,
  InvalidTitleError,
  listTasks,
} from "@backend/tasks/use-cases";

export async function GET(request: NextRequest) {
  const auth = getAuthPayload(request);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get("status") ?? undefined;

  try {
    const result = await listTasks(auth.sub, status);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof InvalidStatusError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const auth = getAuthPayload(request);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  try {
    const task = await createTask(auth.sub, body.title, body.description);
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (
      error instanceof InvalidTitleError ||
      error instanceof InvalidDescriptionError
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
