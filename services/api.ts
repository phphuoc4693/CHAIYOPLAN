
// Thay URL này bằng URL của Backend Service bạn deploy trên Render
// Ví dụ: https://ultimate-flow-backend.onrender.com
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const api = {
  // Tải dữ liệu từ Server
  loadData: async (email: string) => {
    try {
      const response = await fetch(`${API_URL}/api/data/${email}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error("Failed to load data:", error);
      return null;
    }
  },

  // Lưu dữ liệu lên Server
  saveData: async (email: string, appData: any) => {
    try {
      const response = await fetch(`${API_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, data: appData }),
      });
      if (!response.ok) throw new Error('Save failed');
      return await response.json();
    } catch (error) {
      console.error("Failed to save data:", error);
      throw error;
    }
  }
};
