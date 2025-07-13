import fs from "fs";
import { Detail, Action, ActionPanel, Icon, Form, showToast, Toast, LocalStorage } from "@raycast/api";
import { useState, useEffect } from "react";
import { getHandBrakeCLIPath, checkHandBrakeVersion } from "../handBrake/handBrakeCLI";
import { useForm } from "@raycast/utils";

interface IHelloPageProps {
  onContinue: (path: string) => void;
}

interface SelectCLIForm {
  path: string;
}

export function HelloPage({ onContinue }: IHelloPageProps) {
  const [configure, setConfigure] = useState<boolean>(false);
  const [handBrakeCLIPath, setHandBrakePath] = useState<string | null>(null);

  useEffect(() => {
    // System path
    (async () => {
      const path = await getHandBrakeCLIPath();
      setHandBrakePath(path);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (handBrakeCLIPath) {
        console.log("Storing HandbrakeCLI path", handBrakeCLIPath);
        await LocalStorage.setItem("HandBrakeCLIPath", handBrakeCLIPath);
        onContinue(handBrakeCLIPath);
      }
    })();
  }, [handBrakeCLIPath]);

  const { handleSubmit, itemProps, setValue, setValidationError } = useForm<SelectCLIForm>({
    async onSubmit(values) {
      if (values.path) {
        const path = values.path;
        if (path.trim() && fs.existsSync(path)) {
          const version = await checkHandBrakeVersion(path);
          if (version) {
            setHandBrakePath(path);
            showToast({
              style: Toast.Style.Success,
              title: "HandBrakeCLI found:",
              message: version
            });
            return;
          }
        }
      }

      setValidationError("path", "Please select a valid path for HandBrakeCLI");
    },
  });

  function trySetCLIPath(files: string[]) {
    if (files && files[0]) {
      setValue("path", files[0]);
      setValidationError("path", null);
    }
  }

  return configure ? (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Continue" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description
        title=""
        text="Enter or select the path to the HandBrakeCLI. If we found one in your system, it will be be pre-selected, you just need to continue."
      />
      <Form.TextField title="Type the path" placeholder="/path/to/HandBreakCLI" {...itemProps.path} />
      <Form.FilePicker
        title="Or select"
        id="files"
        allowMultipleSelection={false}
        onChange={(value) => trySetCLIPath(value)}
      />
    </Form>
  ) : (
    <Detail
      markdown={`
## 👋🏻 Welcome HandBrake for Raycast!

This extension allows you to easily convert between different media formats using the excellent HandBrakeCLI (https://handbrake.fr/).

If you haven't [installed the HandBrakeCLI](https://handbrake.fr/downloads2.php), please do that before continuing.

I would appreciate a ⭐️ and any suggesiton on my ![](../assets/github-logo.png)[github repo](https://github.com/marcopelegrini/raycast)

Enjoy using the converter!

🏃‍♂️ Let's configure it! Press enter (⏎)
`}
      actions={
        <ActionPanel>
          <Action title="Continue" icon={Icon.Checkmark} onAction={() => setConfigure(true)} />
        </ActionPanel>
      }
    />
  );
}
