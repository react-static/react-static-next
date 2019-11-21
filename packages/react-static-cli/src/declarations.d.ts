interface ReportableMessage {
  type: "message" | "error"
  data: string
}
