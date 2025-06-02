
import * as React from "react"
import { ChevronDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Country {
  code: string
  name: string
  flag: string
  dialCode: string
  format: string
}

const countries: Country[] = [
  { code: "AF", name: "Afeganistão", flag: "🇦🇫", dialCode: "+93", format: "## ### ####" },
  { code: "ZA", name: "África do Sul", flag: "🇿🇦", dialCode: "+27", format: "## ### ####" },
  { code: "AL", name: "Albânia", flag: "🇦🇱", dialCode: "+355", format: "## ### ####" },
  { code: "DE", name: "Alemanha", flag: "🇩🇪", dialCode: "+49", format: "### #######" },
  { code: "AD", name: "Andorra", flag: "🇦🇩", dialCode: "+376", format: "### ###" },
  { code: "AO", name: "Angola", flag: "🇦🇴", dialCode: "+244", format: "### ### ###" },
  { code: "AI", name: "Anguilla", flag: "🇦🇮", dialCode: "+1", format: "(###) ###-####" },
  { code: "AQ", name: "Antarctica", flag: "🇦🇶", dialCode: "+672", format: "### ###" },
  { code: "AG", name: "Antigua e Barbuda", flag: "🇦🇬", dialCode: "+1", format: "(###) ###-####" },
  { code: "AR", name: "Argentina", flag: "🇦🇷", dialCode: "+54", format: "## ####-####" },
  { code: "DZ", name: "Argélia", flag: "🇩🇿", dialCode: "+213", format: "## ### ####" },
  { code: "AM", name: "Armênia", flag: "🇦🇲", dialCode: "+374", format: "## ######" },
  { code: "AW", name: "Aruba", flag: "🇦🇼", dialCode: "+297", format: "### ####" },
  { code: "AU", name: "Austrália", flag: "🇦🇺", dialCode: "+61", format: "### ### ###" },
  { code: "AT", name: "Áustria", flag: "🇦🇹", dialCode: "+43", format: "### ######" },
  { code: "AZ", name: "Azerbaijão", flag: "🇦🇿", dialCode: "+994", format: "## ### ####" },
  { code: "BS", name: "Bahamas", flag: "🇧🇸", dialCode: "+1", format: "(###) ###-####" },
  { code: "BH", name: "Bahrein", flag: "🇧🇭", dialCode: "+973", format: "#### ####" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩", dialCode: "+880", format: "#### ######" },
  { code: "BB", name: "Barbados", flag: "🇧🇧", dialCode: "+1", format: "(###) ###-####" },
  { code: "BY", name: "Belarus", flag: "🇧🇾", dialCode: "+375", format: "## ###-##-##" },
  { code: "BE", name: "Bélgica", flag: "🇧🇪", dialCode: "+32", format: "### ### ###" },
  { code: "BZ", name: "Belize", flag: "🇧🇿", dialCode: "+501", format: "###-####" },
  { code: "BJ", name: "Benin", flag: "🇧🇯", dialCode: "+229", format: "## ## ####" },
  { code: "BM", name: "Bermuda", flag: "🇧🇲", dialCode: "+1", format: "(###) ###-####" },
  { code: "BO", name: "Bolívia", flag: "🇧🇴", dialCode: "+591", format: "########" },
  { code: "BA", name: "Bósnia e Herzegovina", flag: "🇧🇦", dialCode: "+387", format: "## ####" },
  { code: "BW", name: "Botswana", flag: "🇧🇼", dialCode: "+267", format: "## ### ###" },
  { code: "BR", name: "Brasil", flag: "🇧🇷", dialCode: "+55", format: "(##) #####-####" },
  { code: "BN", name: "Brunei", flag: "🇧🇳", dialCode: "+673", format: "### ####" },
  { code: "BG", name: "Bulgária", flag: "🇧🇬", dialCode: "+359", format: "## ### ####" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", dialCode: "+226", format: "## ## ####" },
  { code: "BI", name: "Burundi", flag: "🇧🇮", dialCode: "+257", format: "## ## ####" },
  { code: "BT", name: "Butão", flag: "🇧🇹", dialCode: "+975", format: "## ### ###" },
  { code: "CV", name: "Cabo Verde", flag: "🇨🇻", dialCode: "+238", format: "### ####" },
  { code: "CM", name: "Camarões", flag: "🇨🇲", dialCode: "+237", format: "#### ####" },
  { code: "KH", name: "Camboja", flag: "🇰🇭", dialCode: "+855", format: "## ### ###" },
  { code: "CA", name: "Canadá", flag: "🇨🇦", dialCode: "+1", format: "(###) ###-####" },
  { code: "QA", name: "Catar", flag: "🇶🇦", dialCode: "+974", format: "#### ####" },
  { code: "KZ", name: "Cazaquistão", flag: "🇰🇿", dialCode: "+7", format: "### ###-##-##" },
  { code: "TD", name: "Chade", flag: "🇹🇩", dialCode: "+235", format: "## ## ## ##" },
  { code: "CL", name: "Chile", flag: "🇨🇱", dialCode: "+56", format: "# #### ####" },
  { code: "CN", name: "China", flag: "🇨🇳", dialCode: "+86", format: "### #### ####" },
  { code: "CY", name: "Chipre", flag: "🇨🇾", dialCode: "+357", format: "## ######" },
  { code: "SG", name: "Singapura", flag: "🇸🇬", dialCode: "+65", format: "#### ####" },
  { code: "CO", name: "Colômbia", flag: "🇨🇴", dialCode: "+57", format: "### #######" },
  { code: "KM", name: "Comores", flag: "🇰🇲", dialCode: "+269", format: "### ####" },
  { code: "CG", name: "Congo", flag: "🇨🇬", dialCode: "+242", format: "## ### ####" },
  { code: "KR", name: "Coreia do Sul", flag: "🇰🇷", dialCode: "+82", format: "## ####-####" },
  { code: "KP", name: "Coreia do Norte", flag: "🇰🇵", dialCode: "+850", format: "### ####" },
  { code: "CI", name: "Costa do Marfim", flag: "🇨🇮", dialCode: "+225", format: "## ### ###" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷", dialCode: "+506", format: "#### ####" },
  { code: "HR", name: "Croácia", flag: "🇭🇷", dialCode: "+385", format: "## ### ###" },
  { code: "CU", name: "Cuba", flag: "🇨🇺", dialCode: "+53", format: "# #######" },
  { code: "DK", name: "Dinamarca", flag: "🇩🇰", dialCode: "+45", format: "## ## ## ##" },
  { code: "DJ", name: "Djibouti", flag: "🇩🇯", dialCode: "+253", format: "## ## ## ##" },
  { code: "DM", name: "Dominica", flag: "🇩🇲", dialCode: "+1", format: "(###) ###-####" },
  { code: "EG", name: "Egito", flag: "🇪🇬", dialCode: "+20", format: "### ### ####" },
  { code: "SV", name: "El Salvador", flag: "🇸🇻", dialCode: "+503", format: "#### ####" },
  { code: "AE", name: "Emirados Árabes Unidos", flag: "🇦🇪", dialCode: "+971", format: "## ### ####" },
  { code: "EC", name: "Equador", flag: "🇪🇨", dialCode: "+593", format: "## ### ####" },
  { code: "ER", name: "Eritreia", flag: "🇪🇷", dialCode: "+291", format: "# ### ###" },
  { code: "SK", name: "Eslováquia", flag: "🇸🇰", dialCode: "+421", format: "### ### ###" },
  { code: "SI", name: "Eslovênia", flag: "🇸🇮", dialCode: "+386", format: "## ### ###" },
  { code: "ES", name: "Espanha", flag: "🇪🇸", dialCode: "+34", format: "### ### ###" },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸", dialCode: "+1", format: "(###) ###-####" },
  { code: "EE", name: "Estônia", flag: "🇪🇪", dialCode: "+372", format: "#### ####" },
  { code: "ET", name: "Etiópia", flag: "🇪🇹", dialCode: "+251", format: "## ### ####" },
  { code: "FJ", name: "Fiji", flag: "🇫🇯", dialCode: "+679", format: "### ####" },
  { code: "PH", name: "Filipinas", flag: "🇵🇭", dialCode: "+63", format: "### ### ####" },
  { code: "FI", name: "Finlândia", flag: "🇫🇮", dialCode: "+358", format: "## ### ####" },
  { code: "FR", name: "França", flag: "🇫🇷", dialCode: "+33", format: "# ## ## ## ##" },
  { code: "GA", name: "Gabão", flag: "🇬🇦", dialCode: "+241", format: "## ## ## ##" },
  { code: "GM", name: "Gâmbia", flag: "🇬🇲", dialCode: "+220", format: "### ####" },
  { code: "GH", name: "Gana", flag: "🇬🇭", dialCode: "+233", format: "## ### ####" },
  { code: "GE", name: "Geórgia", flag: "🇬🇪", dialCode: "+995", format: "### ### ###" },
  { code: "GI", name: "Gibraltar", flag: "🇬🇮", dialCode: "+350", format: "### #####" },
  { code: "GR", name: "Grécia", flag: "🇬🇷", dialCode: "+30", format: "### ### ####" },
  { code: "GD", name: "Granada", flag: "🇬🇩", dialCode: "+1", format: "(###) ###-####" },
  { code: "GL", name: "Groenlândia", flag: "🇬🇱", dialCode: "+299", format: "## ## ##" },
  { code: "GP", name: "Guadalupe", flag: "🇬🇵", dialCode: "+590", format: "### ### ###" },
  { code: "GU", name: "Guam", flag: "🇬🇺", dialCode: "+1", format: "(###) ###-####" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹", dialCode: "+502", format: "#### ####" },
  { code: "GY", name: "Guiana", flag: "🇬🇾", dialCode: "+592", format: "### ####" },
  { code: "GF", name: "Guiana Francesa", flag: "🇬🇫", dialCode: "+594", format: "### ### ###" },
  { code: "GN", name: "Guiné", flag: "🇬🇳", dialCode: "+224", format: "## ### ###" },
  { code: "GW", name: "Guiné-Bissau", flag: "🇬🇼", dialCode: "+245", format: "### ####" },
  { code: "GQ", name: "Guiné Equatorial", flag: "🇬🇶", dialCode: "+240", format: "### ### ###" },
  { code: "HT", name: "Haiti", flag: "🇭🇹", dialCode: "+509", format: "## ## ####" },
  { code: "HN", name: "Honduras", flag: "🇭🇳", dialCode: "+504", format: "#### ####" },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰", dialCode: "+852", format: "#### ####" },
  { code: "HU", name: "Hungria", flag: "🇭🇺", dialCode: "+36", format: "## ### ####" },
  { code: "YE", name: "Iêmen", flag: "🇾🇪", dialCode: "+967", format: "### ### ###" },
  { code: "IN", name: "Índia", flag: "🇮🇳", dialCode: "+91", format: "##### #####" },
  { code: "ID", name: "Indonésia", flag: "🇮🇩", dialCode: "+62", format: "###-###-####" },
  { code: "IR", name: "Irã", flag: "🇮🇷", dialCode: "+98", format: "### ### ####" },
  { code: "IQ", name: "Iraque", flag: "🇮🇶", dialCode: "+964", format: "### ### ####" },
  { code: "IE", name: "Irlanda", flag: "🇮🇪", dialCode: "+353", format: "## ### ####" },
  { code: "IS", name: "Islândia", flag: "🇮🇸", dialCode: "+354", format: "### ####" },
  { code: "IL", name: "Israel", flag: "🇮🇱", dialCode: "+972", format: "##-###-####" },
  { code: "IT", name: "Itália", flag: "🇮🇹", dialCode: "+39", format: "### ### ####" },
  { code: "JM", name: "Jamaica", flag: "🇯🇲", dialCode: "+1", format: "(###) ###-####" },
  { code: "JP", name: "Japão", flag: "🇯🇵", dialCode: "+81", format: "##-####-####" },
  { code: "JO", name: "Jordânia", flag: "🇯🇴", dialCode: "+962", format: "# #### ####" },
  { code: "KW", name: "Kuwait", flag: "🇰🇼", dialCode: "+965", format: "#### ####" },
  { code: "LA", name: "Laos", flag: "🇱🇦", dialCode: "+856", format: "## ### ###" },
  { code: "LS", name: "Lesoto", flag: "🇱🇸", dialCode: "+266", format: "#### ####" },
  { code: "LV", name: "Letônia", flag: "🇱🇻", dialCode: "+371", format: "## ### ###" },
  { code: "LB", name: "Líbano", flag: "🇱🇧", dialCode: "+961", format: "## ### ###" },
  { code: "LR", name: "Libéria", flag: "🇱🇷", dialCode: "+231", format: "## ### ###" },
  { code: "LY", name: "Líbia", flag: "🇱🇾", dialCode: "+218", format: "##-#######" },
  { code: "LI", name: "Liechtenstein", flag: "🇱🇮", dialCode: "+423", format: "### ####" },
  { code: "LT", name: "Lituânia", flag: "🇱🇹", dialCode: "+370", format: "### #####" },
  { code: "LU", name: "Luxemburgo", flag: "🇱🇺", dialCode: "+352", format: "### ###" },
  { code: "MO", name: "Macau", flag: "🇲🇴", dialCode: "+853", format: "#### ####" },
  { code: "MK", name: "Macedônia do Norte", flag: "🇲🇰", dialCode: "+389", format: "## ### ###" },
  { code: "MG", name: "Madagascar", flag: "🇲🇬", dialCode: "+261", format: "## ## #####" },
  { code: "MY", name: "Malásia", flag: "🇲🇾", dialCode: "+60", format: "##-### ####" },
  { code: "MW", name: "Malawi", flag: "🇲🇼", dialCode: "+265", format: "#### ####" },
  { code: "MV", name: "Maldivas", flag: "🇲🇻", dialCode: "+960", format: "###-####" },
  { code: "ML", name: "Mali", flag: "🇲🇱", dialCode: "+223", format: "## ## ####" },
  { code: "MT", name: "Malta", flag: "🇲🇹", dialCode: "+356", format: "#### ####" },
  { code: "MA", name: "Marrocos", flag: "🇲🇦", dialCode: "+212", format: "###-######" },
  { code: "MH", name: "Ilhas Marshall", flag: "🇲🇭", dialCode: "+692", format: "###-####" },
  { code: "MQ", name: "Martinica", flag: "🇲🇶", dialCode: "+596", format: "### ## ## ##" },
  { code: "MU", name: "Maurício", flag: "🇲🇺", dialCode: "+230", format: "#### ####" },
  { code: "MR", name: "Mauritânia", flag: "🇲🇷", dialCode: "+222", format: "## ## ####" },
  { code: "YT", name: "Mayotte", flag: "🇾🇹", dialCode: "+262", format: "### ## ## ##" },
  { code: "MX", name: "México", flag: "🇲🇽", dialCode: "+52", format: "### ### ####" },
  { code: "FM", name: "Micronésia", flag: "🇫🇲", dialCode: "+691", format: "###-####" },
  { code: "MZ", name: "Moçambique", flag: "🇲🇿", dialCode: "+258", format: "## ### ####" },
  { code: "MD", name: "Moldova", flag: "🇲🇩", dialCode: "+373", format: "#### ####" },
  { code: "MC", name: "Mônaco", flag: "🇲🇨", dialCode: "+377", format: "## ### ###" },
  { code: "MN", name: "Mongólia", flag: "🇲🇳", dialCode: "+976", format: "#### ####" },
  { code: "ME", name: "Montenegro", flag: "🇲🇪", dialCode: "+382", format: "## ### ###" },
  { code: "MS", name: "Montserrat", flag: "🇲🇸", dialCode: "+1", format: "(###) ###-####" },
  { code: "MM", name: "Myanmar", flag: "🇲🇲", dialCode: "+95", format: "## ### ####" },
  { code: "NA", name: "Namíbia", flag: "🇳🇦", dialCode: "+264", format: "## ### ####" },
  { code: "NR", name: "Nauru", flag: "🇳🇷", dialCode: "+674", format: "### ####" },
  { code: "NP", name: "Nepal", flag: "🇳🇵", dialCode: "+977", format: "##-### ####" },
  { code: "NI", name: "Nicarágua", flag: "🇳🇮", dialCode: "+505", format: "#### ####" },
  { code: "NE", name: "Níger", flag: "🇳🇪", dialCode: "+227", format: "## ## ####" },
  { code: "NG", name: "Nigéria", flag: "🇳🇬", dialCode: "+234", format: "### ### ####" },
  { code: "NU", name: "Niue", flag: "🇳🇺", dialCode: "+683", format: "####" },
  { code: "NO", name: "Noruega", flag: "🇳🇴", dialCode: "+47", format: "### ## ###" },
  { code: "NC", name: "Nova Caledônia", flag: "🇳🇨", dialCode: "+687", format: "## ####" },
  { code: "NZ", name: "Nova Zelândia", flag: "🇳🇿", dialCode: "+64", format: "##-###-####" },
  { code: "OM", name: "Omã", flag: "🇴🇲", dialCode: "+968", format: "#### ####" },
  { code: "NL", name: "Países Baixos", flag: "🇳🇱", dialCode: "+31", format: "## ### ####" },
  { code: "PW", name: "Palau", flag: "🇵🇼", dialCode: "+680", format: "###-####" },
  { code: "PA", name: "Panamá", flag: "🇵🇦", dialCode: "+507", format: "#### ####" },
  { code: "PG", name: "Papua-Nova Guiné", flag: "🇵🇬", dialCode: "+675", format: "### ####" },
  { code: "PK", name: "Paquistão", flag: "🇵🇰", dialCode: "+92", format: "### #######" },
  { code: "PY", name: "Paraguai", flag: "🇵🇾", dialCode: "+595", format: "### ######" },
  { code: "PE", name: "Peru", flag: "🇵🇪", dialCode: "+51", format: "### ### ###" },
  { code: "PF", name: "Polinésia Francesa", flag: "🇵🇫", dialCode: "+689", format: "## ## ##" },
  { code: "PL", name: "Polônia", flag: "🇵🇱", dialCode: "+48", format: "### ### ###" },
  { code: "PR", name: "Porto Rico", flag: "🇵🇷", dialCode: "+1", format: "(###) ###-####" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", dialCode: "+351", format: "### ### ###" },
  { code: "KE", name: "Quênia", flag: "🇰🇪", dialCode: "+254", format: "### ######" },
  { code: "KG", name: "Quirguistão", flag: "🇰🇬", dialCode: "+996", format: "### ### ###" },
  { code: "KI", name: "Kiribati", flag: "🇰🇮", dialCode: "+686", format: "## ###" },
  { code: "GB", name: "Reino Unido", flag: "🇬🇧", dialCode: "+44", format: "#### ######" },
  { code: "CZ", name: "República Tcheca", flag: "🇨🇿", dialCode: "+420", format: "### ### ###" },
  { code: "DO", name: "República Dominicana", flag: "🇩🇴", dialCode: "+1", format: "(###) ###-####" },
  { code: "RE", name: "Reunião", flag: "🇷🇪", dialCode: "+262", format: "### ## ## ##" },
  { code: "RO", name: "Romênia", flag: "🇷🇴", dialCode: "+40", format: "### ### ###" },
  { code: "RW", name: "Ruanda", flag: "🇷🇼", dialCode: "+250", format: "### ### ###" },
  { code: "RU", name: "Rússia", flag: "🇷🇺", dialCode: "+7", format: "### ###-##-##" },
  { code: "EH", name: "Saara Ocidental", flag: "🇪🇭", dialCode: "+212", format: "###-######" },
  { code: "WS", name: "Samoa", flag: "🇼🇸", dialCode: "+685", format: "## ####" },
  { code: "AS", name: "Samoa Americana", flag: "🇦🇸", dialCode: "+1", format: "(###) ###-####" },
  { code: "SM", name: "San Marino", flag: "🇸🇲", dialCode: "+378", format: "#### ######" },
  { code: "SH", name: "Santa Helena", flag: "🇸🇭", dialCode: "+290", format: "#### ####" },
  { code: "LC", name: "Santa Lúcia", flag: "🇱🇨", dialCode: "+1", format: "(###) ###-####" },
  { code: "ST", name: "São Tomé e Príncipe", flag: "🇸🇹", dialCode: "+239", format: "### ####" },
  { code: "SN", name: "Senegal", flag: "🇸🇳", dialCode: "+221", format: "## ### ####" },
  { code: "SL", name: "Serra Leoa", flag: "🇸🇱", dialCode: "+232", format: "## ######" },
  { code: "RS", name: "Sérvia", flag: "🇷🇸", dialCode: "+381", format: "## ### ####" },
  { code: "SC", name: "Seicheles", flag: "🇸🇨", dialCode: "+248", format: "# ### ###" },
  { code: "SY", name: "Síria", flag: "🇸🇾", dialCode: "+963", format: "### ### ###" },
  { code: "SO", name: "Somália", flag: "🇸🇴", dialCode: "+252", format: "## ### ###" },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰", dialCode: "+94", format: "## ### ####" },
  { code: "SZ", name: "Eswatini", flag: "🇸🇿", dialCode: "+268", format: "#### ####" },
  { code: "SD", name: "Sudão", flag: "🇸🇩", dialCode: "+249", format: "## ### ####" },
  { code: "SS", name: "Sudão do Sul", flag: "🇸🇸", dialCode: "+211", format: "## ### ####" },
  { code: "SE", name: "Suécia", flag: "🇸🇪", dialCode: "+46", format: "##-### ####" },
  { code: "CH", name: "Suíça", flag: "🇨🇭", dialCode: "+41", format: "## ### ####" },
  { code: "SR", name: "Suriname", flag: "🇸🇷", dialCode: "+597", format: "###-####" },
  { code: "TJ", name: "Tadjiquistão", flag: "🇹🇯", dialCode: "+992", format: "## ### ####" },
  { code: "TH", name: "Tailândia", flag: "🇹🇭", dialCode: "+66", format: "##-###-####" },
  { code: "TW", name: "Taiwan", flag: "🇹🇼", dialCode: "+886", format: "### ### ###" },
  { code: "TZ", name: "Tanzânia", flag: "🇹🇿", dialCode: "+255", format: "### ### ###" },
  { code: "CX", name: "Ilha Christmas", flag: "🇨🇽", dialCode: "+61", format: "### ### ###" },
  { code: "TL", name: "Timor-Leste", flag: "🇹🇱", dialCode: "+670", format: "### ####" },
  { code: "TG", name: "Togo", flag: "🇹🇬", dialCode: "+228", format: "## ## ####" },
  { code: "TK", name: "Tokelau", flag: "🇹🇰", dialCode: "+690", format: "####" },
  { code: "TO", name: "Tonga", flag: "🇹🇴", dialCode: "+676", format: "## ###" },
  { code: "TT", name: "Trinidad e Tobago", flag: "🇹🇹", dialCode: "+1", format: "(###) ###-####" },
  { code: "TN", name: "Tunísia", flag: "🇹🇳", dialCode: "+216", format: "## ### ###" },
  { code: "TM", name: "Turcomenistão", flag: "🇹🇲", dialCode: "+993", format: "## ######" },
  { code: "TR", name: "Turquia", flag: "🇹🇷", dialCode: "+90", format: "### ### ####" },
  { code: "TV", name: "Tuvalu", flag: "🇹🇻", dialCode: "+688", format: "## ###" },
  { code: "UA", name: "Ucrânia", flag: "🇺🇦", dialCode: "+380", format: "## ### ####" },
  { code: "UG", name: "Uganda", flag: "🇺🇬", dialCode: "+256", format: "### ######" },
  { code: "UY", name: "Uruguai", flag: "🇺🇾", dialCode: "+598", format: "#### ####" },
  { code: "UZ", name: "Uzbequistão", flag: "🇺🇿", dialCode: "+998", format: "## ### ####" },
  { code: "VU", name: "Vanuatu", flag: "🇻🇺", dialCode: "+678", format: "## ###" },
  { code: "VA", name: "Vaticano", flag: "🇻🇦", dialCode: "+39", format: "### ### ####" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪", dialCode: "+58", format: "###-#######" },
  { code: "VN", name: "Vietnã", flag: "🇻🇳", dialCode: "+84", format: "### ### ###" },
  { code: "WF", name: "Wallis e Futuna", flag: "🇼🇫", dialCode: "+681", format: "## ####" },
  { code: "ZM", name: "Zâmbia", flag: "🇿🇲", dialCode: "+260", format: "## ### ####" },
  { code: "ZW", name: "Zimbábue", flag: "🇿🇼", dialCode: "+263", format: "## ### ####" },
]

interface PhoneInputProps extends Omit<React.ComponentProps<"input">, "value" | "onChange"> {
  value?: string
  onChange?: (value: string) => void
  className?: string
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value = "", onChange, ...props }, ref) => {
    const [selectedCountry, setSelectedCountry] = React.useState<Country>(countries.find(c => c.code === "BR") || countries[0])
    const [phoneNumber, setPhoneNumber] = React.useState("")
    const [searchQuery, setSearchQuery] = React.useState("")
    const [isOpen, setIsOpen] = React.useState(false)

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
      setIsOpen(false)
      setSearchQuery("")
    }

    const filteredCountries = countries.filter(country =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.dialCode.includes(searchQuery)
    )

    return (
      <div className="flex">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 rounded-r-none border-r-0 px-3 min-w-[100px]"
              type="button"
            >
              <span className="text-lg">{selectedCountry.flag}</span>
              <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-base mb-3">Selecione um país</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => handleCountryChange(country)}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-accent text-left transition-colors"
                >
                  <span className="text-lg">{country.flag}</span>
                  <div className="flex-1">
                    <div className="font-medium">{country.dialCode} {country.name}</div>
                  </div>
                </button>
              ))}
              {filteredCountries.length === 0 && (
                <div className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum país encontrado
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
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
