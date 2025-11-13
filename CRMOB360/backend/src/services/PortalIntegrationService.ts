import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PortalCredentials {
  vivareal?: {
    api_key: string;
    listing_id?: string;
  };
  zapimoveis?: {
    api_key: string;
    listing_id?: string;
  };
  olx?: {
    api_key: string;
    listing_id?: string;
  };
}

interface ImovelData {
  id: string;
  codigo: string;
  tipo: string;
  finalidade: string;
  titulo: string;
  descricao: string;
  valor: number;
  area_total: number;
  area_construida: number;
  quartos: number;
  banheiros: number;
  vagas_garagem: number;
  endereco_completo: string;
  cidade: string;
  estado: string;
  cep: string;
  fotos?: any[];
}

export class PortalIntegrationService {
  /**
   * Publicar imóvel em todos os portais configurados
   */
  async publicarImovel(imovelId: string) {
    const imovel: any = await prisma.$queryRaw`
      SELECT * FROM imoveis WHERE id = ${imovelId} LIMIT 1
    `;

    if (!imovel || imovel.length === 0) {
      throw new Error('Imóvel não encontrado');
    }

    const imovelData = imovel[0];

    // Buscar integrações ativas
    const integracoes: any = await prisma.$queryRaw`
      SELECT * FROM portal_integracoes WHERE ativo = true
    `;

    const resultados = [];

    for (const integracao of integracoes) {
      try {
        let resultado;

        switch (integracao.nome.toLowerCase()) {
          case 'vivareal':
            resultado = await this.publicarVivaReal(imovelData, integracao);
            break;
          case 'zapimoveis':
            resultado = await this.publicarZapImoveis(imovelData, integracao);
            break;
          case 'olx':
            resultado = await this.publicarOLX(imovelData, integracao);
            break;
          default:
            console.log(`Portal ${integracao.nome} não implementado`);
            continue;
        }

        // Registrar publicação
        await prisma.$queryRaw`
          INSERT INTO publicacoes_portal (
            imovel_id, portal_id, portal_listing_id, status, data_publicacao
          ) VALUES (
            ${imovelId}, ${integracao.id}, ${resultado.listing_id}, 'publicado', NOW()
          )
          ON CONFLICT (imovel_id, portal_id)
          DO UPDATE SET
            portal_listing_id = ${resultado.listing_id},
            status = 'publicado',
            data_publicacao = NOW(),
            ultima_sincronizacao = NOW()
        `;

        resultados.push({
          portal: integracao.nome,
          sucesso: true,
          listing_id: resultado.listing_id
        });
      } catch (error: any) {
        console.error(`Erro ao publicar em ${integracao.nome}:`, error.message);

        // Registrar erro
        await prisma.$queryRaw`
          INSERT INTO publicacoes_portal (
            imovel_id, portal_id, status, erro
          ) VALUES (
            ${imovelId}, ${integracao.id}, 'erro', ${error.message}
          )
          ON CONFLICT (imovel_id, portal_id)
          DO UPDATE SET status = 'erro', erro = ${error.message}
        `;

        resultados.push({
          portal: integracao.nome,
          sucesso: false,
          erro: error.message
        });
      }
    }

    return resultados;
  }

  /**
   * Publicar no Viva Real
   */
  private async publicarVivaReal(imovel: ImovelData, integracao: any) {
    const credenciais = integracao.credenciais;
    const apiUrl = 'https://api.vivareal.com/v2/listings';

    const payload = {
      ListingID: imovel.codigo,
      Title: imovel.titulo,
      TransactionType: imovel.finalidade === 'venda' ? 'Sale' : 'Rental',
      PropertyType: this.mapTipoImovelVivaReal(imovel.tipo),
      Description: imovel.descricao,
      ListPrice: imovel.valor,
      Location: {
        Address: imovel.endereco_completo,
        City: imovel.cidade,
        State: imovel.estado,
        ZipCode: imovel.cep
      },
      Details: {
        LotArea: imovel.area_total,
        LivingArea: imovel.area_construida,
        Bedrooms: imovel.quartos,
        Bathrooms: imovel.banheiros,
        Garage: imovel.vagas_garagem
      },
      Media: this.formatarFotos(imovel.fotos)
    };

    const response = await axios.post(apiUrl, payload, {
      headers: {
        'x-api-key': credenciais.api_key,
        'Content-Type': 'application/json'
      }
    });

    return {
      listing_id: response.data.ListingID || imovel.codigo
    };
  }

  /**
   * Publicar no Zap Imóveis
   */
  private async publicarZapImoveis(imovel: ImovelData, integracao: any) {
    const credenciais = integracao.credenciais;
    const apiUrl = 'https://api.zapimoveis.com.br/v2/listings';

    const payload = {
      externalId: imovel.codigo,
      title: imovel.titulo,
      transactionType: imovel.finalidade === 'venda' ? 'SALE' : 'RENTAL',
      propertyType: this.mapTipoImovelZap(imovel.tipo),
      description: imovel.descricao,
      listingPrice: {
        value: imovel.valor
      },
      address: {
        street: imovel.endereco_completo,
        city: imovel.cidade,
        state: imovel.estado,
        zipCode: imovel.cep
      },
      usableAreas: [imovel.area_construida],
      totalAreas: [imovel.area_total],
      bedrooms: [imovel.quartos],
      bathrooms: [imovel.banheiros],
      parkingSpaces: [imovel.vagas_garagem],
      images: this.formatarFotosZap(imovel.fotos)
    };

    const response = await axios.post(apiUrl, payload, {
      headers: {
        'x-api-key': credenciais.api_key,
        'Content-Type': 'application/json'
      }
    });

    return {
      listing_id: response.data.link?.data || imovel.codigo
    };
  }

  /**
   * Publicar na OLX
   */
  private async publicarOLX(imovel: ImovelData, integracao: any) {
    const credenciais = integracao.credenciais;
    const apiUrl = 'https://apps.olx.com.br/api/ads';

    const payload = {
      external_id: imovel.codigo,
      title: imovel.titulo,
      description: imovel.descricao,
      category: '1020', // Imóveis
      type: imovel.finalidade === 'venda' ? 'sell' : 'rent',
      price: imovel.valor,
      zipcode: imovel.cep,
      params: {
        size: imovel.area_total,
        rooms: imovel.quartos,
        bathrooms: imovel.banheiros,
        garage_spaces: imovel.vagas_garagem
      },
      images: this.formatarFotosOLX(imovel.fotos)
    };

    const response = await axios.post(apiUrl, payload, {
      headers: {
        'Authorization': `Bearer ${credenciais.api_key}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      listing_id: response.data.ad?.id || imovel.codigo
    };
  }

  /**
   * Remover publicação de um portal
   */
  async removerPublicacao(imovelId: string, portalId: string) {
    const publicacao: any = await prisma.$queryRaw`
      SELECT * FROM publicacoes_portal
      WHERE imovel_id = ${imovelId} AND portal_id = ${portalId}
      LIMIT 1
    `;

    if (!publicacao || publicacao.length === 0) {
      throw new Error('Publicação não encontrada');
    }

    const pub = publicacao[0];
    const portal: any = await prisma.$queryRaw`
      SELECT * FROM portal_integracoes WHERE id = ${portalId} LIMIT 1
    `;

    if (!portal || portal.length === 0) {
      throw new Error('Portal não encontrado');
    }

    const integracao = portal[0];

    try {
      switch (integracao.nome.toLowerCase()) {
        case 'vivareal':
          await this.removerVivaReal(pub.portal_listing_id, integracao);
          break;
        case 'zapimoveis':
          await this.removerZapImoveis(pub.portal_listing_id, integracao);
          break;
        case 'olx':
          await this.removerOLX(pub.portal_listing_id, integracao);
          break;
      }

      // Atualizar status
      await prisma.$queryRaw`
        UPDATE publicacoes_portal
        SET status = 'removido', data_remocao = NOW()
        WHERE id = ${pub.id}
      `;

      return { sucesso: true };
    } catch (error: any) {
      console.error(`Erro ao remover publicação de ${integracao.nome}:`, error.message);
      throw error;
    }
  }

  /**
   * Sincronizar estatísticas dos portais
   */
  async sincronizarEstatisticas(imovelId: string) {
    const publicacoes: any = await prisma.$queryRaw`
      SELECT p.*, i.nome, i.credenciais
      FROM publicacoes_portal p
      JOIN portal_integracoes i ON i.id = p.portal_id
      WHERE p.imovel_id = ${imovelId} AND p.status = 'publicado'
    `;

    for (const pub of publicacoes) {
      try {
        let stats;

        switch (pub.nome.toLowerCase()) {
          case 'vivareal':
            stats = await this.getStatsVivaReal(pub.portal_listing_id, pub.credenciais);
            break;
          case 'zapimoveis':
            stats = await this.getStatsZapImoveis(pub.portal_listing_id, pub.credenciais);
            break;
          case 'olx':
            stats = await this.getStatsOLX(pub.portal_listing_id, pub.credenciais);
            break;
          default:
            continue;
        }

        // Atualizar estatísticas
        await prisma.$queryRaw`
          UPDATE publicacoes_portal
          SET
            visualizacoes = ${stats.visualizacoes},
            leads_gerados = ${stats.leads},
            ultima_sincronizacao = NOW()
          WHERE id = ${pub.id}
        `;
      } catch (error: any) {
        console.error(`Erro ao sincronizar ${pub.nome}:`, error.message);
      }
    }
  }

  /**
   * Mapear tipo de imóvel para Viva Real
   */
  private mapTipoImovelVivaReal(tipo: string): string {
    const mapa: any = {
      'apartamento': 'Apartment',
      'casa': 'Home',
      'terreno': 'Land',
      'comercial': 'Commercial',
      'rural': 'Farm'
    };
    return mapa[tipo.toLowerCase()] || 'Residential';
  }

  /**
   * Mapear tipo de imóvel para Zap Imóveis
   */
  private mapTipoImovelZap(tipo: string): string {
    const mapa: any = {
      'apartamento': 'APARTMENT',
      'casa': 'HOME',
      'terreno': 'LAND',
      'comercial': 'COMMERCIAL',
      'rural': 'FARM'
    };
    return mapa[tipo.toLowerCase()] || 'RESIDENTIAL';
  }

  /**
   * Formatar fotos para diferentes portais
   */
  private formatarFotos(fotos: any[] = []): string[] {
    return fotos.map(f => f.url || f);
  }

  private formatarFotosZap(fotos: any[] = []) {
    return fotos.map(f => ({ url: f.url || f }));
  }

  private formatarFotosOLX(fotos: any[] = []) {
    return fotos.map(f => ({ url: f.url || f }));
  }

  /**
   * Remover de portais específicos
   */
  private async removerVivaReal(listingId: string, integracao: any) {
    const apiUrl = `https://api.vivareal.com/v2/listings/${listingId}`;
    await axios.delete(apiUrl, {
      headers: { 'x-api-key': integracao.credenciais.api_key }
    });
  }

  private async removerZapImoveis(listingId: string, integracao: any) {
    const apiUrl = `https://api.zapimoveis.com.br/v2/listings/${listingId}`;
    await axios.delete(apiUrl, {
      headers: { 'x-api-key': integracao.credenciais.api_key }
    });
  }

  private async removerOLX(listingId: string, integracao: any) {
    const apiUrl = `https://apps.olx.com.br/api/ads/${listingId}`;
    await axios.delete(apiUrl, {
      headers: { 'Authorization': `Bearer ${integracao.credenciais.api_key}` }
    });
  }

  /**
   * Obter estatísticas dos portais
   */
  private async getStatsVivaReal(listingId: string, credenciais: any) {
    const apiUrl = `https://api.vivareal.com/v2/listings/${listingId}/stats`;
    const response = await axios.get(apiUrl, {
      headers: { 'x-api-key': credenciais.api_key }
    });

    return {
      visualizacoes: response.data.views || 0,
      leads: response.data.leads || 0
    };
  }

  private async getStatsZapImoveis(listingId: string, credenciais: any) {
    const apiUrl = `https://api.zapimoveis.com.br/v2/listings/${listingId}/statistics`;
    const response = await axios.get(apiUrl, {
      headers: { 'x-api-key': credenciais.api_key }
    });

    return {
      visualizacoes: response.data.views || 0,
      leads: response.data.contacts || 0
    };
  }

  private async getStatsOLX(listingId: string, credenciais: any) {
    const apiUrl = `https://apps.olx.com.br/api/ads/${listingId}/stats`;
    const response = await axios.get(apiUrl, {
      headers: { 'Authorization': `Bearer ${credenciais.api_key}` }
    });

    return {
      visualizacoes: response.data.views || 0,
      leads: response.data.replies || 0
    };
  }

  /**
   * Listar publicações de um imóvel
   */
  async listarPublicacoes(imovelId: string) {
    return await prisma.$queryRaw`
      SELECT
        p.*,
        i.nome as portal_nome
      FROM publicacoes_portal p
      JOIN portal_integracoes i ON i.id = p.portal_id
      WHERE p.imovel_id = ${imovelId}
      ORDER BY p.created_at DESC
    `;
  }

  /**
   * Configurar integração com portal
   */
  async configurarPortal(dados: any) {
    const { nome, credenciais, configuracoes } = dados;

    await prisma.$queryRaw`
      INSERT INTO portal_integracoes (nome, credenciais, configuracoes, ativo)
      VALUES (${nome}, ${JSON.stringify(credenciais)}, ${JSON.stringify(configuracoes || {})}, true)
      ON CONFLICT (nome)
      DO UPDATE SET
        credenciais = ${JSON.stringify(credenciais)},
        configuracoes = ${JSON.stringify(configuracoes || {})},
        updated_at = NOW()
    `;

    return { sucesso: true, mensagem: `Portal ${nome} configurado com sucesso` };
  }
}

export default new PortalIntegrationService();
