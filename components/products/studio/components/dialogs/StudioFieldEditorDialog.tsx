"use client";

import { useState } from "react";

import {
  Check,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  StudioFieldEditorOptions,
} from "../../context/StudioContext";

interface StudioFieldEditorDialogProps {
  open: boolean;

  editor: StudioFieldEditorOptions | null;

  onClose(): void;
}

export default function StudioFieldEditorDialog({
  open,
  editor,
  onClose,
}: StudioFieldEditorDialogProps) {
  const editorKey = editor
    ? `${editor.title}:${editor.label ?? ""}:${editor.value}`
    : "closed";

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!state) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-2xl">
        {editor ? (
          <StudioFieldEditorForm
            key={editorKey}
            editor={editor}
            onClose={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function StudioFieldEditorForm({
  editor,
  onClose,
}: {
  editor: StudioFieldEditorOptions;
  onClose(): void;
}) {
  const [value, setValue] = useState(editor.value);

  function handleSave() {
    editor.onSave(value);
    onClose();
  }

  function renderInput() {
    switch (editor.inputType) {
      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="min-h-[180px]"
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        );

      case "select":
        return (
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {editor.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        );
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editor.title}</DialogTitle>

        {(editor.description || editor.marketplace) && (
          <DialogDescription>
            {editor.description}

            {editor.marketplace && (
              <span className="mt-2 block text-xs">
                Marketplace:{" "}
                <strong>{editor.marketplace}</strong>
              </span>
            )}
          </DialogDescription>
        )}
      </DialogHeader>

      <div className="space-y-3">
        {editor.label && (
          <label className="text-sm font-medium">
            {editor.label}
          </label>
        )}

        {renderInput()}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>

        <Button onClick={handleSave}>
          <Check className="mr-2 h-4 w-4" />
          Save
        </Button>
      </DialogFooter>
    </>
  );
}
