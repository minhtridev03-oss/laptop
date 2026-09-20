export async function extractSpecsWithGemini(apiKey, category, name, description) {
  if (!apiKey) throw new Error("Vui lòng cung cấp API Key");

  // Danh sách 3 model hỗ trợ chính thức
  const models = ["gemini-3.5-flash-lite", "gemini-3.1-pro", "gemini-3.6-flash"];

  const prompt = `Bạn là một chuyên gia phần cứng máy tính. Nhiệm vụ của bạn là đọc Tên sản phẩm và Mô tả, sau đó trích xuất các thông số kỹ thuật.
Danh mục: "${category}"

Hãy trả về JSON chứa các field tương ứng với linh kiện. BẮT BUỘC TRẢ VỀ CHUẨN JSON, KHÔNG CÓ MARKDOWN.
Yêu cầu quan trọng:
1. Bạn phải trích xuất ĐẦY ĐỦ VÀ CHI TIẾT NHẤT CÓ THỂ mọi thông số kỹ thuật (không bỏ sót cổng kết nối, pin, trọng lượng, kích thước, webcam, v.v.).
2. Nếu có Mô tả, hãy ưu tiên trích xuất từ mô tả.
3. Nếu Mô tả bị thiếu, hoặc không đủ thông tin, bạn ĐƯỢC PHÉP sử dụng kiến thức chuyên môn của mình để tự động điền các thông số chính xác nhất dựa vào Tên sản phẩm hoặc SKU. Hãy điền càng chi tiết càng tốt, không được để trống nếu bạn biết thông số đó.

Ngoài các thông số kỹ thuật tự do, hãy ĐẢM BẢO trích xuất các trường BẮT BUỘC sau để tương thích với hệ thống PC Builder và So sánh:
- "brand": Tên thương hiệu (vd: Asus, Intel, Corsair...)
- "sku": Mã sản phẩm / Part number (vd: TUF-B760M, i5-12400F...)
- "component_type": Phân loại linh kiện ("cpu", "mainboard", "ram", "gpu", "storage", "psu", "case", "cooler", "laptop", "monitor")
- "builder_enabled": luôn là true (trừ laptop/pc nguyên chiếc là false)
- "builder_tier": Đánh giá phân khúc ("premium", "balanced", "entry")
- "spec_cpu": Chi tiết CPU, BẮT BUỘC ghi rõ mã (vd: Intel Core Ultra 9 185H, i9-14900HX, không chỉ ghi chung chung)
- "spec_ram": Chi tiết RAM (bắt buộc với laptop/PC)
- "spec_storage": Chi tiết Ổ cứng (bắt buộc với laptop/PC)
- "spec_gpu": Chi tiết Card đồ họa (bắt buộc với laptop/PC)
- "display": Chi tiết Màn hình (độ phân giải, tần số quét, tấm nền, độ phủ màu...)
- "ports": Liệt kê các cổng kết nối
- "network": Công nghệ Lan / Wifi / Bluetooth (vd: Wi-Fi 6E, Bluetooth 5.3)
- "material": Chất liệu máy (vd: Hợp kim nhôm, Nhựa cao cấp...)
- "weight": Cân nặng (vd: "1.5 kg")

Ví dụ:
Với Laptop/PC nguyên chiếc: {"brand": "Asus", "sku": "GU606", "component_type": "laptop", "builder_enabled": false, "spec_cpu": "Intel Core Ultra 9 185H", "spec_ram": "32GB LPDDR5X", "spec_storage": "1TB SSD NVMe", "spec_gpu": "RTX 4070 8GB", "display": "16 inch 2.5K OLED 240Hz", "ports": "2x Type-C, 2x USB-A", "network": "Wi-Fi 7, Bluetooth 5.4", "material": "Nhôm nguyên khối CNC", "weight": "1.85 kg"}
Với Mainboard: {"brand": "Asus", "sku": "TUF-B760M", "component_type": "mainboard", "builder_enabled": true, "builder_tier": "balanced", "socket": "LGA1700|AM5", "ram_type": "DDR4|DDR5", "form_factor": "ATX|mATX", "memory_slots": 4}
Với CPU: {"brand": "Intel", "sku": "i5-12400F", "component_type": "cpu", "builder_enabled": true, "builder_tier": "balanced", "socket": "...", "ram_type": "...", "tdp": 65}
Với VGA/GPU: {"brand": "Gigabyte", "sku": "GV-N", "component_type": "gpu", "builder_enabled": true, "builder_tier": "premium", "memory_gb": 8, "recommended_psu_w": 600}
Nếu hoàn toàn không có thông tin, trả về null cho field đó. Không được trả về lúc đủ lúc thiếu.
  
Dữ liệu đầu vào:
Tên: ${name}
Mô tả: ${description}`;

  let lastError = null;

  // Lặp qua từng model, nếu model trước lỗi thì thử model tiếp theo
  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          }),
        }
      );

      if (!response.ok) {
        let errorMsg = `[Model ${model}] Lỗi API`;
        try {
          const errData = await response.json();
          errorMsg += `: ${errData.error?.message || response.statusText}`;
        } catch (e) {
          errorMsg += ` (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error(`[Model ${model}] Không trả về dữ liệu hợp lệ`);

      return JSON.parse(text);
    } catch (err) {
      lastError = err;
      console.warn(`Thử model ${model} thất bại, đang chuyển sang model tiếp theo...`);
    }
  }

  // Nếu cả 3 model đều lỗi mới ném ra ngoại lệ
  throw lastError || new Error("Cả 3 model Gemini đều không thể xử lý yêu cầu.");
}