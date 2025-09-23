import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

const LoadingSpinner = ({
  size = 40,
  message = "Loading...",
  fullScreen = true,
  color = "primary",
  videoSrc = "loader.mp4",
  videoSize = 200,
}) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
      sx={{
        ...(fullScreen && {
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          zIndex: 9999,
        }),
        ...(!fullScreen && {
          padding: 4,
          minHeight: 200,
        }),
      }}
    >
      {videoSrc && (
        <video
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          style={{
            width: videoSize,
            height: "auto",
            borderRadius: 8,
          }}
        />
      )}

      {/* <CircularProgress size={size} color={color} /> */}

      {message && (
        <Typography variant="body1" color="textSecondary">
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingSpinner;
