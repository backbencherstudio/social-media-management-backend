import { Test, TestingModule } from '@nestjs/testing';
import { FeatureServices } from './feature_service';
import { PrismaService } from '../../../prisma/prisma.service';
import { Feature } from '@prisma/client';
import { CreateFeatureDto } from './dto/create-feature-dto';
import { UpdateFeatureDto } from './dto/update-feature-dto';

describe('FeatureServices', () => {
  let service: FeatureServices;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureServices,
        {
          provide: PrismaService,
          useValue: {
            feature: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<FeatureServices>(FeatureServices);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create a feature and return id and success msg', async () => {
    const mockDto: CreateFeatureDto = {
      name: 'Test Feature',
    };

    const mockResult: Feature = {
      id: 'abc123',
      name: 'Test Feature',
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
      status: 1,
    };

    jest.spyOn(prisma.feature, 'create').mockResolvedValue(mockResult);

    const result = await service.create(mockDto);

    expect(result).toEqual({
      success: true,
      message: 'Feature created successfully',
      feature_id: 'abc123',
    });
  });

  it('should return all features', async () => {
    const mockFeatures: Feature[] = [
      {
        id: '1',
        name: 'Feature A',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        status: 1,
      },
    ];

    jest.spyOn(prisma.feature, 'findMany').mockResolvedValue(mockFeatures);

    const result = await service.findAll();
    expect(result).toEqual(mockFeatures);
  });

  it('should return a single feature by id', async () => {
    const mockFeature: Feature = {
      id: '1',
      name: 'Feature A',
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
      status: 1,
    };

    jest.spyOn(prisma.feature, 'findUnique').mockResolvedValue(mockFeature);

    const result = await service.findOne('1');
    expect(result).toEqual(mockFeature);
  });

  it('should update a feature and return success msg', async () => {
    const updateDto: UpdateFeatureDto = {
      name: 'Updated Feature',
    };

    const updated: Feature = {
      id: '1',
      name: 'Updated Feature',
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
      status: 1,
    };

    jest.spyOn(prisma.feature, 'update').mockResolvedValue(updated);

    const result = await service.update('1', updateDto);
    expect(result).toEqual({
      success: true,
      message: 'Feature updated successfully',
      feature_id: '1',
    });
  });

  it('should delete a feature and return success msg', async () => {
    const deleted: Feature = {
      id: '1',
      name: 'Deleted Feature',
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
      status: 1,
    };

    jest.spyOn(prisma.feature, 'delete').mockResolvedValue(deleted);

    const result = await service.remove('1');
    expect(result).toEqual({
      success: true,
      message: 'Feature deleted successfully',
      feature_id: '1',
    });
  });
});
