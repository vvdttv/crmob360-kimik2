import { Request, Response, NextFunction } from 'express';
import { PropertyService } from '@/services/PropertyService';
import { AuthRequest } from '@/middleware/auth';
import { AppError } from '@/utils/AppError';

const propertyService = new PropertyService();

export class PropertyController {
  // Imóveis
  async listarImoveis(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = {
        status: req.query.status as string,
        tipo_imovel: req.query.tipo as string,
        finalidade: req.query.finalidade as string,
        bairro: req.query.bairro as string,
        cidade: req.query.cidade as string,
        uf: req.query.uf as string,
        valor_min: parseFloat(req.query.valor_min as string),
        valor_max: parseFloat(req.query.valor_max as string),
        quartos: parseInt(req.query.quartos as string),
        banheiros: parseInt(req.query.banheiros as string),
        vagas_garagem: parseInt(req.query.vagas as string),
        area_min: parseFloat(req.query.area_min as string),
        area_max: parseFloat(req.query.area_max as string),
        responsavel_id: req.query.responsavel_id as string,
        proprietario_id: req.query.proprietario_id as string,
        search: req.query.search as string,
        skip: parseInt(req.query.skip as string) || 0,
        take: parseInt(req.query.take as string) || 20
      };

      const result = await propertyService.listarImoveis(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async buscarImovel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const imovel = await propertyService.buscarImovel(id);
      res.json(imovel);
    } catch (error) {
      next(error);
    }
  }

  async buscarImovelPorCodigo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { codigo } = req.params;
      const imovel = await propertyService.buscarImovelPorCodigo(codigo);
      res.json(imovel);
    } catch (error) {
      next(error);
    }
  }

  async criarImovel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Usuário não autenticado', 401);
      }

      const imovel = await propertyService.criarImovel(req.body, req.user.id);
      res.status(201).json(imovel);
    } catch (error) {
      next(error);
    }
  }

  async atualizarImovel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const imovel = await propertyService.atualizarImovel(id, req.body);
      res.json(imovel);
    } catch (error) {
      next(error);
    }
  }

  async deletarImovel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await propertyService.deletarImovel(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // Publicação
  async publicarImovel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Usuário não autenticado', 401);
      }

      const { id } = req.params;
      const { portais, data_exclusividade } = req.body;

      const result = await propertyService.publicarImovel(id, portais, req.user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Chaves
  async listarChaves(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const imovelId = req.params.id;
      const chaves = await propertyService.listarChaves(imovelId);
      res.json(chaves);
    } catch (error) {
      next(error);
    }
  }

  async emprestarChave(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Usuário não autenticado', 401);
      }

      const { id } = req.params;
      const result = await propertyService.emprestarChave(id, req.user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async devolverChave(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Usuário não autenticado', 401);
      }

      const { id } = req.params;
      const result = await propertyService.devolverChave(id, req.user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Documentos
  async listarDocumentos(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const imovelId = req.params.id;
      const documentos = await propertyService.listarDocumentos(imovelId);
      res.json(documentos);
    } catch (error) {
      next(error);
    }
  }

  async criarDocumento(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Usuário não autenticado', 401);
      }

      const documento = await propertyService.criarDocumento(req.body, req.user.id);
      res.status(201).json(documento);
    } catch (error) {
      next(error);
    }
  }

  // Analytics
  async getEstoqueAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const analytics = await propertyService.getEstoqueAnalytics();
      res.json(analytics);
    } catch (error) {
      next(error);
    }
  }

  // Matching
  async buscarImoveisCompativeis(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { cliente_id } = req.params;
      const limite = parseInt(req.query.limite as string) || 10;

      const result = await propertyService.buscarImoveisCompativeis(cliente_id, limite);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}