"use server";

import { revalidatePath } from "next/cache";
import { requireSecretary } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getTrimmedString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getOptionalDateTimeValue(formData: FormData, key: string) {
  const raw = getTrimmedString(formData, key);

  if (!raw) {
    return null;
  }

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date for ${key}.`);
  }

  return parsed;
}

function assertConfirmationPhrase(formData: FormData, expected: string) {
  const confirmation = getTrimmedString(formData, "confirmation").toUpperCase();

  if (confirmation !== expected) {
    throw new Error(`Please type ${expected} to confirm this action.`);
  }
}

export async function createSecretaryUpdate(formData: FormData) {
  const { user } = await requireSecretary();
  const title = getTrimmedString(formData, "title");
  const body = getTrimmedString(formData, "body");
  const postedAt = getOptionalDateTimeValue(formData, "postedAt") ?? new Date();
  const image = formData.get("image");

  if (!title) {
    throw new Error("A title is required.");
  }

  if (!body) {
    throw new Error("A post body is required.");
  }

  let imageData: string | null = null;

  if (image instanceof File && image.size > 0) {
    if (!image.type.startsWith("image/")) {
      throw new Error("Only image files can be uploaded.");
    }

    if (image.size > 5 * 1024 * 1024) {
      throw new Error("Please upload an image smaller than 5MB.");
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    imageData = `data:${image.type};base64,${buffer.toString("base64")}`;
  }

  await prisma.secretaryUpdate.create({
    data: {
      title,
      body,
      postedAt,
      imageData,
      postedByMemberId: user.id,
    },
  });

  revalidatePath("/updates");
  revalidatePath("/portal/secretary");
}

export async function updateSecretaryUpdate(formData: FormData) {
  await requireSecretary();

  const updateId = getTrimmedString(formData, "updateId");
  const title = getTrimmedString(formData, "title");
  const body = getTrimmedString(formData, "body");
  const postedAt = getOptionalDateTimeValue(formData, "postedAt") ?? new Date();
  const removeImage = formData.get("removeImage") === "on";
  const image = formData.get("image");

  if (!updateId) {
    throw new Error("Update id is required.");
  }

  if (!title) {
    throw new Error("A title is required.");
  }

  if (!body) {
    throw new Error("A post body is required.");
  }

  const existingUpdate = await prisma.secretaryUpdate.findUnique({
    where: {
      id: updateId,
    },
    select: {
      id: true,
      imageData: true,
    },
  });

  if (!existingUpdate) {
    throw new Error("That update could not be found.");
  }

  let imageData = removeImage ? null : existingUpdate.imageData;

  if (image instanceof File && image.size > 0) {
    if (!image.type.startsWith("image/")) {
      throw new Error("Only image files can be uploaded.");
    }

    if (image.size > 5 * 1024 * 1024) {
      throw new Error("Please upload an image smaller than 5MB.");
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    imageData = `data:${image.type};base64,${buffer.toString("base64")}`;
  }

  await prisma.secretaryUpdate.update({
    where: {
      id: updateId,
    },
    data: {
      title,
      body,
      postedAt,
      imageData,
    },
  });

  revalidatePath("/updates");
  revalidatePath("/portal/secretary");
}

export async function deleteSecretaryUpdate(formData: FormData) {
  await requireSecretary();

  const updateId = getTrimmedString(formData, "updateId");

  if (!updateId) {
    throw new Error("Update id is required.");
  }

  assertConfirmationPhrase(formData, "DELETE");

  await prisma.secretaryUpdate.delete({
    where: {
      id: updateId,
    },
  });

  revalidatePath("/updates");
  revalidatePath("/portal/secretary");
}
