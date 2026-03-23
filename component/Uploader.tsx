'use client'
import React, { useCallback, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { FileRejection, useDropzone } from "react-dropzone";
import { CustomToast } from "./CustomToast";


const Uploader = () => {
    const [toast, setToast] = useState({ show: false, message: '' });

    const showCustomToast = (msg: string) => {
        setToast({ show: true, message: msg });

        setTimeout(() => setToast({ show: false, message: '' }), 4000);
    };
    const onDrop = useCallback((acceptedFiles: File[]) => {
        // Do something with the files
        console.log(acceptedFiles)
    }, [])

    const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
        if (fileRejections.length > 0) {
            // 1. If they dropped a massive amount of filesshow the limit error
            if (fileRejections.length > 5) {
                showCustomToast(`You dropped ${fileRejections.length} files. Max limit is 5.`);
                return;
            }

            // 2. Otherwise, collect unique error messages
            const errorMessages = new Set<string>();

            fileRejections.forEach(({ file, errors }) => {
                errors.forEach((err) => {
                    switch (err.code) {
                        case 'file-too-large':
                            errorMessages.add(`${file.name} is larger than 10MB.`);
                            break;
                        case 'file-invalid-type':
                            errorMessages.add(`${file.name} is not a supported image.`);
                            break;
                        case 'too-many-files':
                            errorMessages.add("Maximum 5 files allowed.");
                            break;
                        default:
                            errorMessages.add(err.message);
                    }
                });
            });

            // 3. Join them and show
            const finalMessage = Array.from(errorMessages).slice(0, 2).join(' '); // Show max 2 errors to keep toast clean
            showCustomToast(finalMessage);
        }
    }, []);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDropRejected, onDrop, maxFiles: 5, maxSize: 10 * 1024 * 1024, accept: { 'image/*': ['.png', '.jpg', '.jpeg'] } })
    return (
        <div className="w-full max-w-xl mx-auto space-y-4">

            {/* Upload Box */}
            <div {...getRootProps()} className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-gray-400 transition">
                <input {...getInputProps()} />
                {
                    isDragActive ? (

                        <p className="text-sm text-white font-medium">
                            Drop your files here
                        </p>
                    ) : (
                        <>
                            <UploadCloud className="w-10 h-10 text-gray-500 mb-2" />

                            <p className="text-sm text-white">
                                Drag & drop files here or{" "}
                                <span className="text-blue-500 font-medium">
                                    browse
                                </span>
                            </p>

                            <p className="text-xs text-gray-400 mt-1">
                                PNG, JPG, PDF up to 10MB
                            </p>
                        </>
                    )
                }

            </div>

            {/* Uploaded File List UI */}
            <div className="space-y-3">

                {/* File Item */}
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">

                    <div className="flex items-center gap-3">

                        {/* File Icon */}
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            📄
                        </div>

                        {/* File Info */}
                        <div>
                            <p className="text-sm font-medium text-gray-800">
                                example-file.pdf
                            </p>
                            <p className="text-xs text-gray-500">
                                2.4 MB
                            </p>
                        </div>

                    </div>

                    {/* Remove Button */}
                    <button className="p-1 rounded-md hover:bg-red-100 transition">
                        <X className="w-4 h-4 text-red-500" />
                    </button>

                </div>

                {/* Another Static File (UI Demo) */}
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">

                    <div className="flex items-center gap-3">

                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            🖼️
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-800">
                                profile-image.png
                            </p>
                            <p className="text-xs text-gray-500">
                                1.1 MB
                            </p>
                        </div>

                    </div>

                    <button className="p-1 rounded-md hover:bg-red-100 transition">
                        <X className="w-4 h-4 text-red-500" />
                    </button>

                </div>

            </div>
            {toast.show && (
                <CustomToast
                    message={toast.message}
                    onClose={() => setToast({ show: false, message: '' })}
                />
            )}
        </div>
    );
};

export default Uploader;