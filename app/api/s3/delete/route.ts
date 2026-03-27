import { s3 } from "@/lib/s3client"
import { DeleteObjectCommand } from "@aws-sdk/client-s3"
import { NextResponse } from "next/server"

export async function DELETE(request: Request){

    try {
        const body=await request.json()
         const key=body.key

         if(!key){
            return NextResponse.json({erorr:"key is required",status:400})
         }
         const command=new DeleteObjectCommand({
            Bucket:process.env.AWS_BUCKET_NAME!,
            Key:key
         })
         const response=await s3.send(command)

         return NextResponse.json({message:"file deleted successfully",status:200})
    } catch (error) {
        
        return NextResponse.json({error:"feild to delete file ",status:500})
        console.log(error)
    
    }
}