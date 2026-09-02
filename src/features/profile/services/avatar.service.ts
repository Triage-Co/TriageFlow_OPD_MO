const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";

export const avatarService = {
  
  async uploadAvatar(localUri: string): Promise<string> {
    console.log("[avatarService] Khởi động upload ảnh qua XHR, localUri:", localUri);
    const filename = localUri.split("/").pop() ?? "avatar.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";
    console.log("[avatarService] Thông tin file:", { filename, type });

    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", {
        uri: localUri,
        name: filename,
        type: type,
      } as any);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
      console.log("[avatarService] Đang mở kết nối POST tới:", url);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);

      xhr.onload = () => {
        console.log("[avatarService] XHR Response status:", xhr.status);
        if (xhr.status === 200 || xhr.status === 201) {
          try {
            const data = JSON.parse(xhr.responseText);
            console.log("[avatarService] Upload thành công! URL ảnh:", data.secure_url);
            resolve(data.secure_url as string);
          } catch (e) {
            console.error("[avatarService] Lỗi parse JSON phản hồi:", e);
            reject(new Error("Lỗi định dạng dữ liệu phản hồi từ Cloudinary."));
          }
        } else {
          console.error("[avatarService] Upload thất bại. Chi tiết phản hồi:", xhr.responseText);
          reject(new Error(`Upload ảnh thất bại (HTTP ${xhr.status}): ${xhr.responseText}`));
        }
      };

      xhr.onerror = (e) => {
        console.error("[avatarService] Kết nối XHR gặp lỗi mạng:", e);
        reject(new Error("Lỗi mạng xảy ra trong quá trình upload ảnh."));
      };

      console.log("[avatarService] Đang gửi dữ liệu Form...");
      xhr.send(formData);
    });
  },
};
