import { GoogleIndisponivelError, searchGoogle } from "@/lib/google"
import { searchOsm } from "@/lib/osm"
import { MAX_NICHOS, QUANTIDADES, SearchError, type PedidoBusca, type SearchEvent } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const MAX_EXCLUIR = 5000

function lerPedido(body: unknown): PedidoBusca {
  const b = (body ?? {}) as Record<string, unknown>
  const cidade = typeof b.cidade === "string" ? b.cidade.trim().slice(0, 120) : ""
  const nichos = Array.isArray(b.nichos)
    ? [...new Set(b.nichos.filter((x): x is string => typeof x === "string").map((x) => x.trim().slice(0, 60)).filter(Boolean))]
    : []
  const quantidade = Number(b.quantidade)
  const excluir = Array.isArray(b.excluir)
    ? b.excluir.filter((x): x is string => typeof x === "string").slice(0, MAX_EXCLUIR)
    : []

  if (!cidade) throw new SearchError("Informe a cidade para buscar.")
  if (nichos.length === 0) throw new SearchError("Escolha pelo menos um nicho.")
  if (nichos.length > MAX_NICHOS) throw new SearchError(`Escolha no máximo ${MAX_NICHOS} nichos por busca.`)
  if (!(QUANTIDADES as readonly number[]).includes(quantidade)) throw new SearchError("Quantidade de leads inválida.")

  return { cidade, nichos, quantidade, excluir }
}

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  const body = await request.json().catch(() => null)
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: SearchEvent) => {
        if (request.signal.aborted) return
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"))
      }

      try {
        const pedido = lerPedido(body)

        // Google Maps quando a chave funciona; senão, OpenStreetMap (gratuito).
        let usouGoogle = false
        if (apiKey) {
          try {
            await searchGoogle(apiKey, pedido, emit, request.signal)
            usouGoogle = true
          } catch (err) {
            if (!(err instanceof GoogleIndisponivelError)) throw err
            console.warn("Google Maps indisponível, usando OpenStreetMap:", err.message)
          }
        }
        if (!usouGoogle) {
          await searchOsm(pedido, emit, request.signal)
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
