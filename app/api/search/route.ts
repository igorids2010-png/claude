import { GoogleIndisponivelError, searchGoogle } from "@/lib/google"
import { searchOsm } from "@/lib/osm"
import { SearchError, type SearchEvent } from "@/lib/types"

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
        if (!cidade || !nicho) {
          throw new SearchError("Informe a cidade e o nicho para buscar.")
        }

        // Google Maps quando a chave funciona; senão, OpenStreetMap (gratuito).
        let usouGoogle = false
        if (apiKey) {
          try {
            await searchGoogle(apiKey, { cidade, nicho }, emit, request.signal)
            usouGoogle = true
          } catch (err) {
            if (!(err instanceof GoogleIndisponivelError)) throw err
            console.warn("Google Maps indisponível, usando OpenStreetMap:", err.message)
          }
        }
        if (!usouGoogle) {
          await searchOsm({ cidade, nicho }, emit, request.signal)
        }
      } catch (err) {
        if (!request.signal.aborted) {
          const message =
            err instanceof SearchError ? err.message : "Falha ao consultar o mapa. Tente novamente em instantes."
          if (!(err instanceof SearchError)) console.error(err)
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
