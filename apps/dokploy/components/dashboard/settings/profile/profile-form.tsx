import { AlertBlock } from "@/components/shared/alert-block";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { generateSHA256Hash } from "@/lib/utils";
import { api } from "@/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2, Upload, User } from "lucide-react";
import { useTranslation } from "next-i18next";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Disable2FA } from "./disable-2fa";
import { Enable2FA } from "./enable-2fa";

const profileSchema = z.object({
	name: z.string().optional(),
	email: z.string()
		.min(1, "Email is required")
		.email("Please enter a valid email address"),
	password: z.string().nullable(),
	currentPassword: z.string().nullable(),
	image: z.string().optional(),
	allowImpersonation: z.boolean().optional().default(false),
});

type Profile = z.infer<typeof profileSchema>;

const randomImages = [
	"/avatars/avatar-1.png",
	"/avatars/avatar-2.png",
	"/avatars/avatar-3.png",
	"/avatars/avatar-4.png",
	"/avatars/avatar-5.png",
	"/avatars/avatar-6.png",
	"/avatars/avatar-7.png",
	"/avatars/avatar-8.png",
	"/avatars/avatar-9.png",
	"/avatars/avatar-10.png",
	"/avatars/avatar-11.png",
	"/avatars/avatar-12.png",
];

export const ProfileForm = () => {
	const utils = api.useUtils();
	const { data, refetch, isLoading } = api.user.get.useQuery();
	const { data: isCloud } = api.settings.isCloud.useQuery();

	const {
		mutateAsync,
		isLoading: isUpdating,
		isError,
		error,
	} = api.user.update.useMutation();
	const { t } = useTranslation("settings");
	const [gravatarHash, setGravatarHash] = useState<string | null>(null);

	const availableAvatars = useMemo(() => {
		if (gravatarHash === null) return randomImages;
		return randomImages.concat([
			`https://www.gravatar.com/avatar/${gravatarHash}`,
		]);
	}, [gravatarHash]);

    const form = useForm<Profile>({
		defaultValues: {
			name: data?.user?.name || "",
			email: data?.user?.email || "",
			password: "",
			image: data?.user?.image || "",
			currentPassword: "",
			allowImpersonation: data?.user?.allowImpersonation || false,
		},
		resolver: zodResolver(profileSchema),
	});

    const [uploadPreview, setUploadPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);

    const handleImageFile = async (file: File) => {
        // Validate type and size (<= 2MB)
        if (!file.type.startsWith("image/")) {
            toast.error("Please select a valid image file");
            return;
        }
        const maxBytes = 2 * 1024 * 1024; // 2MB
        if (file.size > maxBytes) {
            toast.error("Image must be 2MB or less");
            return;
        }
        setIsUploading(true);
        try {
            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = reader.result as string;
                setUploadPreview(dataUrl);
                form.setValue("image", dataUrl, { shouldDirty: true });
            };
            reader.readAsDataURL(file);
        } finally {
            setIsUploading(false);
        }
    };

	useEffect(() => {
		if (data) {
			form.reset(
				{
					name: data?.user?.name || "",
					email: data?.user?.email || "",
					password: form.getValues("password") || "",
					image: data?.user?.image || "",
					currentPassword: form.getValues("currentPassword") || "",
					allowImpersonation: data?.user?.allowImpersonation,
				},
				{
					keepValues: true,
				},
			);
			form.setValue("allowImpersonation", data?.user?.allowImpersonation);

			if (data.user.email) {
				generateSHA256Hash(data.user.email).then((hash) => {
					setGravatarHash(hash);
				});
			}
		}
	}, [form, data]);

	const onSubmit = async (values: Profile) => {
		await mutateAsync({
			name: values.name?.trim() || "",  // Send empty string to clear name, not undefined
			email: values.email.toLowerCase(),
			password: values.password || undefined,
			image: values.image,
			currentPassword: values.currentPassword || undefined,
			allowImpersonation: values.allowImpersonation,
		})
			.then(async () => {
				// Invalidate all user queries to refresh data across components
				await utils.user.get.invalidate();
				toast.success("Profile Updated");
				form.reset({
					name: values.name,
					email: values.email,
					password: "",
					image: values.image,
					currentPassword: "",
				});
			})
			.catch(() => {
				toast.error("Error updating the profile");
			});
	};

	return (
		<div className="w-full">
			<Card className="h-full bg-sidebar  p-2.5 rounded-xl  max-w-5xl mx-auto">
				<div className="rounded-xl bg-background shadow-md ">
					<CardHeader className="flex flex-row gap-2 flex-wrap justify-between items-center">
						<div>
							<CardTitle className="text-xl flex flex-row gap-2">
								<User className="size-6 text-muted-foreground self-center" />
								{t("settings.profile.title")}
							</CardTitle>
							<CardDescription>
								{t("settings.profile.description")}
							</CardDescription>
						</div>
						{!data?.user.twoFactorEnabled ? <Enable2FA /> : <Disable2FA />}
					</CardHeader>

					<CardContent className="space-y-2 py-8 border-t">
						{isError && <AlertBlock type="error">{error?.message}</AlertBlock>}
						{isLoading ? (
							<div className="flex flex-row gap-2 items-center justify-center text-sm text-muted-foreground min-h-[35vh]">
								<span>Loading...</span>
								<Loader2 className="animate-spin size-4" />
							</div>
						) : (
							<>
								<Form {...form}>
									<form
										onSubmit={form.handleSubmit(onSubmit)}
										className="grid gap-4"
									>
										<div className="space-y-4">
											<FormField
												control={form.control}
												name="name"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Name</FormLabel>
														<FormControl>
															<Input
																placeholder="Enter your name"
																{...field}
																value={field.value || ""}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="email"
												render={({ field }) => (
													<FormItem>
														<FormLabel>{t("settings.profile.email")}</FormLabel>
														<FormControl>
															<Input
																placeholder={t("settings.profile.email")}
																{...field}
															/>
														</FormControl>
														<FormDescription>
															Your email address is required for account authentication and notifications.
														</FormDescription>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="currentPassword"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Current Password</FormLabel>
														<FormControl>
															<Input
																type="password"
																placeholder={t("settings.profile.password")}
																{...field}
																value={field.value || ""}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="password"
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															{t("settings.profile.password")}
														</FormLabel>
														<FormControl>
															<Input
																type="password"
																placeholder={t("settings.profile.password")}
																{...field}
																value={field.value || ""}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

                                            <FormField
												control={form.control}
												name="image"
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															{t("settings.profile.avatar")}
														</FormLabel>
														<FormControl>
                                                            <RadioGroup
																onValueChange={(e) => {
																	field.onChange(e);
																}}
																defaultValue={field.value}
																value={field.value}
																className="flex flex-row flex-wrap gap-2 max-xl:justify-center"
															>
                                                                {/* Upload option */}
                                                                <FormItem key="__upload__">
                                                                    <FormLabel className="[&:has([data-state=checked])>div]:border-primary [&:has([data-state=checked])>div]:border-1 [&:has([data-state=checked])>div]:p-px cursor-pointer">
                                                                        <FormControl>
                                                                            <RadioGroupItem
                                                                                value={uploadPreview || "__upload__"}
                                                                                className="sr-only"
                                                                            />
                                                                        </FormControl>
                                                                        <div className="h-12 w-12 rounded-full border flex items-center justify-center overflow-hidden relative">
                                                                            {uploadPreview || (typeof field.value === "string" && field.value.startsWith("data:image")) ? (
                                                                                <img
                                                                                    src={(uploadPreview as string) || field.value}
                                                                                    alt="uploaded avatar"
                                                                                    className="h-12 w-12 object-cover"
                                                                                />
                                                                            ) : (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => document.getElementById("avatar-file-input")?.click()}
                                                                                    className="h-full w-full flex items-center justify-center text-muted-foreground hover:text-foreground"
                                                                                >
                                                                                    {isUploading ? (
                                                                                        <Loader2 className="size-4 animate-spin" />
                                                                                    ) : (
                                                                                        <ImagePlus className="size-5" />
                                                                                    )}
                                                                                </button>
                                                                            )}
                                                                            <input
                                                                                id="avatar-file-input"
                                                                                type="file"
                                                                                accept="image/*"
                                                                                className="hidden"
                                                                                onChange={(e) => {
                                                                                    const file = e.target.files?.[0];
                                                                                    if (file) {
                                                                                        void handleImageFile(file);
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </FormLabel>
                                                                </FormItem>

																{availableAvatars.map((image) => (
																	<FormItem key={image}>
																		<FormLabel className="[&:has([data-state=checked])>img]:border-primary [&:has([data-state=checked])>img]:border-1 [&:has([data-state=checked])>img]:p-px cursor-pointer">
																			<FormControl>
																				<RadioGroupItem
																					value={image}
																					className="sr-only"
																				/>
																			</FormControl>

																			<img
																				key={image}
																				src={image}
																				alt="avatar"
																				className="h-12 w-12 rounded-full border hover:p-px hover:border-primary transition-transform"
																			/>
																		</FormLabel>
																	</FormItem>
																))}
															</RadioGroup>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											{isCloud && (
												<FormField
													control={form.control}
													name="allowImpersonation"
													render={({ field }) => (
														<FormItem className="flex flex-row items-center justify-between p-3 mt-4 border rounded-lg shadow-sm">
															<div className="space-y-0.5">
																<FormLabel>Allow Impersonation</FormLabel>
																<FormDescription>
																	Enable this option to allow Dokploy Cloud
																	administrators to temporarily access your
																	account for troubleshooting and support
																	purposes. This helps them quickly identify and
																	resolve any issues you may encounter.
																</FormDescription>
															</div>
															<FormControl>
																<Switch
																	checked={field.value}
																	onCheckedChange={field.onChange}
																/>
															</FormControl>
														</FormItem>
													)}
												/>
											)}
										</div>

										<div className="flex items-center justify-end gap-2">
											<Button type="submit" isLoading={isUpdating}>
												{t("settings.common.save")}
											</Button>
										</div>
									</form>
								</Form>
							</>
						)}
					</CardContent>
				</div>
			</Card>
		</div>
	);
};
