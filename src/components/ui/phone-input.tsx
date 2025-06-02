
import * as React from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Country {
  code: string
  name: string
  flag: string
  dialCode: string
  format: string
}

const countries: Country[] = [
  {
    code: "BR",
    name: "Brasil",
    flag: "🇧🇷",
    dialCode: "+55",
    format: "(##) #####-####"
  },
  {
    code: "US",
    name: "Estados Unidos",
    flag: "🇺🇸",
    dialCode: "+1",
    format: "(###) ###-####"
  },
  {
    code: "AR",
    name: "Argentina",
    flag: "🇦🇷",
    dialCode: "+54",
    format: "## ####-####"
  },
  {
    code: "PT",
    name: "Portugal",
    flag: "🇵🇹",
    dialCode: "+351",
    format: "### ### ###"
  },
  {
    code: "ES",
    name: "Espanha",
    flag: "🇪🇸",
    dialCode: "+34",
    format: "### ### ###"
  },
  {
    code: "FR",
    name: "França",
    flag: "🇫🇷",
    dialCode: "+33",
    format: "# ## ## ## ##"
  },
  {
    code: "DE",
    name: "Alemanha",
    flag: "🇩🇪",
    dialCode: "+49",
    format: "### #######"
  },
  {
    code: "IT",
    name: "Itália",
    flag: "🇮🇹",
    dialCode: "+39",
    format: "### ### ####"
  }
]

interface PhoneInputProps extends Omit<React.ComponentProps<"input">, "value" | "onChange"> {
  value?: string
  onChange?: (value: string) => void
  className?: string
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value = "", onChange, ...props }, ref) => {
    const [selectedCountry, setSelectedCountry] = React.useState<Country>(countries[0])
    const [phoneNumber, setPhoneNumber] = React.useState("")

    React.useEffect(() => {
      if (value && value !== `${selectedCountry.dialCode} ${phoneNumber}`) {
        // Parse existing value
        const country = countries.find(c => value.startsWith(c.dialCode))
        if (country) {
          setSelectedCountry(country)
          setPhoneNumber(value.replace(country.dialCode + " ", ""))
        } else {
          setPhoneNumber(value.replace(selectedCountry.dialCode + " ", ""))
        }
      }
    }, [value, selectedCountry.dialCode, phoneNumber])

    const formatPhoneNumber = (input: string, format: string) => {
      const numbers = input.replace(/\D/g, "")
      let formatted = ""
      let numberIndex = 0

      for (let i = 0; i < format.length && numberIndex < numbers.length; i++) {
        if (format[i] === "#") {
          formatted += numbers[numberIndex]
          numberIndex++
        } else {
          formatted += format[i]
        }
      }

      return formatted
    }

    const handlePhoneChange = (newPhone: string) => {
      const formatted = formatPhoneNumber(newPhone, selectedCountry.format)
      setPhoneNumber(formatted)
      const fullValue = `${selectedCountry.dialCode} ${formatted}`
      onChange?.(fullValue)
    }

    const handleCountryChange = (country: Country) => {
      setSelectedCountry(country)
      const fullValue = `${country.dialCode} ${phoneNumber}`
      onChange?.(fullValue)
    }

    return (
      <div className="flex">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 rounded-r-none border-r-0 px-3"
              type="button"
            >
              <span className="text-lg">{selectedCountry.flag}</span>
              <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {countries.map((country) => (
              <DropdownMenuItem
                key={country.code}
                onClick={() => handleCountryChange(country)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <span className="text-lg">{country.flag}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{country.name}</span>
                  <span className="text-sm text-muted-foreground">{country.dialCode}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Input
          {...props}
          ref={ref}
          value={phoneNumber}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder={selectedCountry.format.replace(/#/g, "9")}
          className={cn("rounded-l-none", className)}
        />
      </div>
    )
  }
)
PhoneInput.displayName = "PhoneInput"

export { PhoneInput }
