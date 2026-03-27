"use client";

import React, { useCallback, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { FileRejection, useDropzone } from "react-dropzone";
import Image from "next/image";
import { v4 as uuidv4 } from "uuid";
import { CustomToast } from "./CustomToast";

type UploadItem = {
  id: string;
  file: File;
  uploading: boolean;
  progress: number;
  key?: string;
  isDeleting: boolean;
  error: boolean;
  objectUrl?: string;    // local preview
  remoteUrl?: string;    // final S3 URL
};

const Uploader = () => {
  const [toast, setToast] = useState({ show: false, message: "" });
  const [files, setFiles] = useState<UploadItem[]>([]);

  const showCustomToast = (msg: string) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: "" }), 4000);
  };








  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    if (bytes < 1024) return `${bytes} Bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const removeFile = async (fileId: string) => {
    try {

      const fileToRemove = files.find((f) => f.id === fileId);

      if (!fileToRemove) {
        throw new Error("File not found");
      }

      if (fileToRemove.objectUrl) {
        URL.revokeObjectURL(fileToRemove.objectUrl);
      }
      setFiles((prevFiles) =>
        prevFiles.map((f) => (f.id === fileId ? { ...f, isDeleting: true } : f))
      );





      const response = await fetch("/api/s3/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: fileToRemove?.key }),
      });

      if (!response.ok) {
        showCustomToast("Delete failed");
        setFiles((prevFiles) =>
          prevFiles.map((f) =>
            f.id === fileId ? { ...f, isDeleting: false, error: true } : f
          )
        );
        return;
      }

      setFiles((prevFiles) =>
        prevFiles.filter((f) => f.id !== fileId)
      );
    } catch (error) {
      console.error(error);
      showCustomToast("Delete failed");
    }
  };

  const uploadFile = async (file: File) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.file === file ? { ...f, uploading: true, error: false } : f
      )
    );

    try {
      // 1) ask API for presigned URL
      const presignedUrlResponse = await fetch("/api/s3", {
        method: "POST",
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          size: file.size,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!presignedUrlResponse.ok) {
        showCustomToast("Failed to generate presigned URL");
        setFiles((prev) =>
          prev.map((f) =>
            f.file === file
              ? { ...f, uploading: false, error: true, progress: 0 }
              : f
          )
        );
        return;
      }

      const { presignedUrl, uniqueKey, fileUrl } =
        await presignedUrlResponse.json();

      // 2) upload directly to S3 via XHR PUT
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            setFiles((prev) =>
              prev.map((f) =>
                f.file === file
                  ? {
                    ...f,
                    progress: Math.round(progress),
                    key: uniqueKey,
                  }
                  : f
              )
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 204) {
            setFiles((prev) =>
              prev.map((f) =>
                f.file === file
                  ? {
                    ...f,
                    progress: 100,
                    uploading: false,
                    error: false,
                    remoteUrl: fileUrl,
                  }
                  : f
              )
            );
            resolve();
          } else {
            showCustomToast("Upload failed");
            setFiles((prev) =>
              prev.map((f) =>
                f.file === file
                  ? { ...f, uploading: false, error: true }
                  : f
              )
            );
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          showCustomToast("Upload failed");
          setFiles((prev) =>
            prev.map((f) =>
              f.file === file ? { ...f, uploading: false, error: true } : f
            )
          );
          reject(new Error("Network error during upload"));
        };

        console.log("Presigned URL:", presignedUrl);
        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });
    } catch (error) {
      console.error(error);
      showCustomToast("Upload failed");
      setFiles((prev) =>
        prev.map((f) =>
          f.file === file ? { ...f, progress: 0, uploading: false, error: true } : f
        )
      );
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const newFiles: UploadItem[] = acceptedFiles.map((file) => ({
        id: uuidv4(),
        file,
        uploading: true,
        progress: 0,
        isDeleting: false,
        error: false,
        objectUrl: URL.createObjectURL(file),
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
    acceptedFiles.forEach((file) => uploadFile(file));
  }, []);

  const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      if (fileRejections.length > 5) {
        showCustomToast(`You dropped ${fileRejections.length} files. Max limit is 5.`);
        return;
      }

      const errorMessages = new Set<string>();

      fileRejections.forEach(({ file, errors }) => {
        errors.forEach((err) => {
          switch (err.code) {
            case "file-too-large":
              errorMessages.add(`${file.name} is larger than 10MB.`);
              break;
            case "file-invalid-type":
              errorMessages.add(`${file.name} is not a supported image.`);
              break;
            case "too-many-files":
              errorMessages.add("Maximum 5 files allowed.");
              break;
            default:
              errorMessages.add(err.message);
          }
        });
      });

      const finalMessage = Array.from(errorMessages).slice(0, 2).join(" ");
      showCustomToast(finalMessage);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDropRejected,
    onDrop,
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024,
    accept: { "image/*": [".png", ".jpg", ".jpeg"] },
  });

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      <div
        {...getRootProps()}
        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-gray-400 transition"
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-sm text-white font-medium">Drop your files here</p>
        ) : (
          <>
            <UploadCloud className="w-10 h-10 text-gray-500 mb-2" />
            <p className="text-sm text-white">
              Drag & drop files here or{" "}
              <span className="text-blue-500 font-medium">browse</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PNG, JPG up to 10MB
            </p>
          </>
        )}
      </div>

      <div className="space-y-3">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 relative h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                {file.objectUrl ? (
                  <Image
                    src={file.objectUrl}
                    alt={file.file.name}
                    fill
                    className="rounded-lg object-cover"
                  />
                ) : (
                  <div className="text-xs text-gray-400">No img</div>
                )}
              </div>

              <div className="flex flex-col w-full max-w-xs">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {file.file.name}
                </p>

                <p className="text-xs text-gray-500">
                  {formatFileSize(file.file.size)}
                </p>

                {file.uploading && (
                  <div className="mt-2 w-full">
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-200"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {file.progress}%
                    </p>
                  </div>
                )}

                {!file.uploading && !file.error && file.progress === 100 && (
                  <p className="text-[10px] text-green-500 mt-1">
                    Uploaded ✓
                  </p>
                )}

                {file.error && (
                  <p className="text-[10px] text-red-500 mt-1">
                    Upload failed
                  </p>
                )}

                {/* Optional: show remote URL when done */}
                {!file.uploading && file.remoteUrl && (
                  <a
                    href={file.remoteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-blue-500 mt-1 underline"
                  >
                    Open in S3
                  </a>
                )}
              </div>
            </div>

            <button
              onClick={() => removeFile(file.id)}
              className="p-1 rounded-md hover:bg-red-100 transition"
            >
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>
        ))}
      </div>

      {toast.show && (
        <CustomToast
          message={toast.message}
          onClose={() => setToast({ show: false, message: "" })}
        />
      )}
    </div>
  );
};

export default Uploader;
