import { Form, ActionPanel, Action, showToast, Toast, showInFinder, Icon, LocalStorage } from "@raycast/api";
import { useState, useEffect } from "react";
import {
  convertMedia,
  checkExtensionType,
  INPUT_VIDEO_EXTENSIONS,
} from "../gifski/converter";

export function ConverterForm({ initialFiles = [] }: { initialFiles?: string[] }) {
  const [isConverting, setConverting] = useState(false);
  const [currentFiles, setCurrentFiles] = useState<string[]>(initialFiles || []);
  const [fps, setFps] = useState<string>("10");
  const [scale, setScale] = useState<string>("1024");

  useEffect(() => {
    loadDefaults();
    handleFileSelect(initialFiles);
  }, []);

  const loadDefaults = () => {
    (async () => {
      const fps = await LocalStorage.getItem("fps");
      const scale = await LocalStorage.getItem("scale");
      if (fps && typeof fps === "string") {
        setFps(fps);
      }
      if (scale && typeof scale === "string") {
        setScale(scale);
      }
    })();
  };

  useEffect(() => {
    (async () => {
      if (fps) {
        await LocalStorage.setItem("preset", fps);
      }
      if (scale) {
        await LocalStorage.setItem("preset", scale);
      }
    })();
  }, [fps, scale]);


  const handleFileSelect = (files: string[]) => {
    // Files to convert
    let convertibles: string[] = [];

    try {
      convertibles = files.filter((file) => checkExtensionType(file, INPUT_VIDEO_EXTENSIONS));
      if (convertibles.length === 0) {
        showToast({
          style: Toast.Style.Failure,
          title: "Invalid selection",
          message: "No valid media files selected. Please select video files",
        });
      }
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Error processing files",
        message: String(error),
      });
    } finally {
      setCurrentFiles(convertibles);
    }
  };

  const handleSubmit = async () => {
    setConverting(true);
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: `Converting ${currentFiles.length} file${currentFiles.length > 1 ? "s" : ""}...`,
    });

    for (const item of currentFiles) {
      try {
        const outputPath = await convertMedia(item, ".gif", fps, scale);

        await toast.hide();
        await showToast({
          style: Toast.Style.Success,
          title: "File converted successfully!",
          message: "⌘O to open the file",
          primaryAction: {
            title: "Open File",
            shortcut: { modifiers: ["cmd"], key: "o" },
            onAction: () => {
              showInFinder(outputPath);
            },
          },
        });
      } catch (error) {
        await toast.hide();
        await showToast({ style: Toast.Style.Failure, title: "Conversion failed", message: String(error) });
      }
    }
    setConverting(false);
  };

  return (
    <Form
      isLoading={isConverting}
      actions={
        <ActionPanel>
          {currentFiles && currentFiles.length > 0 && (
            <Action.SubmitForm title="Convert" onSubmit={handleSubmit} icon={Icon.NewDocument} />
          )}
        </ActionPanel>
      }
    >
      <Form.FilePicker
        id="selectFiles"
        title="Select files"
        allowMultipleSelection={true}
        value={currentFiles}
        onChange={(newFiles) => {
          handleFileSelect(newFiles);
        }}
      />
      {currentFiles.length > 0 && (
        <>
          <Form.Dropdown
            id="fps"
            title="Select fps"
            {...(fps.length > 0 && fps ? { defaultValue: fps } : {})}
            onChange={setFps}
          >
            {["10", "15", "30"].map((fps) => (
              <Form.Dropdown.Item value={fps} title={fps} key={fps} />
            ))}
          </Form.Dropdown>
          <Form.Dropdown
            id="scale"
            title="Select scale"
            {...(scale.length > 0 && scale ? { defaultValue: scale } : {})}
            onChange={setScale}
          >
            {["600", "800", "1024"].map((scale) => (
              <Form.Dropdown.Item value={scale} title={scale} key={scale} />
            ))}
          </Form.Dropdown>
        </>
      )}
    </Form>
  );
}
