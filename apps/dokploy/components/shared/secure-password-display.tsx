import copy from "copy-to-clipboard";
import { Clipboard, EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface SecurePasswordDisplayProps {
	password: string;
	className?: string;
}

export const SecurePasswordDisplay = ({ password, className = "" }: SecurePasswordDisplayProps) => {
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);

	const togglePasswordVisibility = () => {
		setIsPasswordVisible((prevVisibility) => !prevVisibility);
	};

	const copyToClipboard = () => {
		copy(password);
		toast.success("Password copied to clipboard");
	};

	const displayValue = isPasswordVisible ? password : "••••••••";

	return (
		<div className={`flex items-center space-x-2 ${className}`}>
			<Input
				type="text"
				value={displayValue}
				readOnly
				className="font-mono text-sm"
				style={{ 
					backgroundColor: 'transparent',
					border: 'none',
					boxShadow: 'none',
					padding: '0'
				}}
			/>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				onClick={copyToClipboard}
				className="h-8 w-8"
				title="Copy password to clipboard"
			>
				<Clipboard className="size-4 text-muted-foreground" />
			</Button>
			<Button 
				type="button"
				variant="ghost"
				size="icon"
				onClick={togglePasswordVisibility}
				className="h-8 w-8"
				title={isPasswordVisible ? "Hide password" : "Show password"}
			>
				{isPasswordVisible ? (
					<EyeOffIcon className="size-4 text-muted-foreground" />
				) : (
					<EyeIcon className="size-4 text-muted-foreground" />
				)}
			</Button>
		</div>
	);
};


