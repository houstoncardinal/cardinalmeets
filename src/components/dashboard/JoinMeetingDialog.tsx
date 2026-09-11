import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { isValidMeetingCode, normalizeMeetingCode } from "@/lib/meetingLinks";

const joinSchema = z.object({
  meetingCode: z.string().min(1, "Meeting code is required"),
}).refine((data) => isValidMeetingCode(data.meetingCode), {
  message: "Enter a valid meeting code or invite link",
  path: ["meetingCode"],
});

type JoinFormData = z.infer<typeof joinSchema>;

interface JoinMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoin: (meetingCode: string) => void;
}

export function JoinMeetingDialog({
  open,
  onOpenChange,
  onJoin,
}: JoinMeetingDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<JoinFormData>({
    resolver: zodResolver(joinSchema),
    defaultValues: {
      meetingCode: "",
    },
  });

  const onSubmit = async (data: JoinFormData) => {
    setIsLoading(true);
    
    // Clean the meeting code (remove URL parts if pasted)
    const code = normalizeMeetingCode(data.meetingCode);
    
    onJoin(code);
    setIsLoading(false);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Video className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Join a Meeting</DialogTitle>
          <DialogDescription className="text-center">
            Enter the meeting code or paste the meeting link to join.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="meetingCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="abc-defg-hij or paste link"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Join Meeting
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
