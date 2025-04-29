import React from "react";

function Loading() {
  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3">プロフィールを確認中...</p>
        </div>
    </div>
  );
}
export default Loading;