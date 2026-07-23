"use client"

import { apiFetch } from "@/lib/client-api"
import type { PresignV2Item, PresignV2Response, S3UploadType } from "@/types/aws-s3"

type UploadOptions = {
  uploadType: S3UploadType
  file: File
  contentType?: string
  onProgress?: (progress: number) => void
}

function readApiError(response: Response) {
  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    return response.json().then((payload: { message?: string } | null) => payload?.message || `Request failed with ${response.status}`)
  }

  return response.text().then((text) => text || `Request failed with ${response.status}`)
}

function putFileToS3(item: PresignV2Item, file: File, contentType: string, onProgress?: (progress: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", item.presignedPutUrl)
    xhr.setRequestHeader("Content-Type", contentType)

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return
      onProgress?.(Math.round((event.loaded / event.total) * 100))
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100)
        resolve()
        return
      }

      reject(new Error(`S3 upload failed with status ${xhr.status}`))
    }

    xhr.onerror = () => reject(new Error("S3 upload failed. Check S3 CORS and network connectivity."))
    xhr.send(file)
  })
}

export async function uploadFileWithPresignedPut({ uploadType, file, contentType, onProgress }: UploadOptions) {
  const resolvedContentType = contentType || file.type || "application/octet-stream"
  const presignResponse = await apiFetch("/api/aws/s3/presign", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      uploadType,
      count: 1,
      defaultContentType: resolvedContentType,
    }),
  })

  if (!presignResponse.ok) {
    throw new Error(await readApiError(presignResponse))
  }

  const payload = (await presignResponse.json()) as PresignV2Response
  const item = payload.items?.[0]

  if (!item?.key || !item.presignedPutUrl) {
    throw new Error("AWS integration did not return an upload URL")
  }

  if (item.maxSizeBytes != null && file.size > item.maxSizeBytes) {
    throw new Error(`File exceeds the ${Math.round(item.maxSizeBytes / 1024 / 1024)} MB upload limit`)
  }

  await putFileToS3(item, file, item.contentType || resolvedContentType, onProgress)

  return item.key
}
