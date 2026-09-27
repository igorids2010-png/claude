import { PlacesError, searchSemSite, type SearchEvent } from "@/lib/places"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cidade = (searchParams.get("cidade") ?? "").trim()
  const nicho = (searchParams.get("nicho") ?? "").trim()
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: SearchEvent) => {
        if (request.signal.aborted) return
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"))
      }

      try {
        if (!apiKey) {
          throw new PlacesError(
            "Chave do Google Maps não configurada. Defina GOOGLE_MAPS_API_KEY no .env.local (ou nas variáveis de ambiente da Vercel).",
          )
        }
        if (!cidade || !nicho) {
          throw new PlacesError("Informe a cidade e o nicho para buscar.")
        }

        await searchSemSite(apiKey, { cidade, nicho }, emit, request.signal)
      } catch (err) {
        if (!request.signal.aborted) {
          const message =
            err instanceof PlacesError ? err.message : "Falha ao consultar o Google Maps. Tente novamente em instantes."
          if (!(err instanceof PlacesError)) console.error(err)
          emit({ type: "error", message })
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  })
}
