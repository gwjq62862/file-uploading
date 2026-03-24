import { NextResponse } from "next/server"
import z from "zod"
import { v4 as uuidv4 } from 'uuid';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner"
import { s3 } from "@/lib/s3client";

const uplaodSchema = z.object({
    fileName: z.string(),
    size: z.number(),
    contentType: z.string()
})



export async function POST(request: Request) {
    try {
        const body = await request.json()
        const validation = uplaodSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json({
                erorr: "Invail Request body",
                status: 400
            })

        }

        const { fileName, contentType, size } = validation.data
        const uniqueKey=`${uuidv4()}-${fileName}`


        const command=new PutObjectCommand({
            Bucket:process.env.AWS_BUCKET_NAME,
            Key:uniqueKey,
            ContentType:contentType,
            ContentLength:size
        })
         const presigendUrl=await getSignedUrl(s3,command,{expiresIn:360})


 const response={
    presigendUrl,
    uniqueKey
 }

  return NextResponse.json(response,{status:200})
    } catch (error) {
        return NextResponse.json({
            erorr: "Internal Server Error",
            status: 500
        })
    }
}
