import React from "react";

function Loading({ text }) {
  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3">{text}</p>
        </div>
    </div>
  );
}
export default Loading;