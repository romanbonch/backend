import { HttpException, Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { BlockModel } from "../models/block.model";
import { BlockCreateDto } from "../dtos/block-create.dto";
import { TestBlockProvider } from "../../test-block/providers/test-block.provider";
import { TestBlockCreateDto } from "../../test-block/dtos/test-block-create.dto";
import { BlockFilterDto } from "../dtos/block-filter.dto";
import { BlockUpdateDto } from "../dtos/block-update.dto";
import { Sequelize } from "sequelize-typescript";
import { Transaction } from "sequelize";
import { TestModel } from "../../test/models/test.model";

@Injectable()
export class BlockProvider {
  constructor(
    @InjectModel(BlockModel) private blockModel: BlockModel,
    @Inject(TestBlockProvider) private testBlockProvider: TestBlockProvider,
    private sequelize: Sequelize
  ) {
  }

  private createTestBlockDto(blockId: number, tests: number[]): TestBlockCreateDto[] {
    return tests.map(el => {
      return {
        block_id: blockId,
        test_id: el
      }
    })
  }

  async getAll(filter: BlockFilterDto): Promise<BlockModel[]> {
    console.log(filter)
    return await BlockModel.findAll({
      where: {
        ...filter
      },
      include: [TestModel]
    });
  }

  async getOne(blockId: number, rawData: boolean = false): Promise<BlockModel> {
    return BlockModel.findOne({
      where: {
        id: blockId,
      },
      include: rawData ? [] : [TestModel]
    })
  }

  async create(createDto: BlockCreateDto): Promise<BlockModel> {
    console.log(createDto);
    return await (new Promise(async (resolve, reject) => {
      await this.sequelize.transaction(async t => {
        const host = { transaction: t };
        await BlockModel.create({
          name: createDto.name,
          company_id: createDto.company_id,
        }).then(async res => {
          await this.appendTests(res.id, createDto.tests, host).then(() => res).catch(err => reject(err));
          resolve(res);
        }).catch(err => reject(err));
      })
    }))
  }

  async remove(blockId: number): Promise<boolean> {
    await this.testBlockProvider.removeAllRelations(0, blockId);
    return (await BlockModel.destroy({
      where: {
        id: blockId
      }
    })) > 0;
  }

  async update(blockId: number, updateDto: BlockUpdateDto): Promise<BlockModel> {
    await BlockModel.update({
      ...updateDto
    }, {
      where: {
        id: blockId
      }
    });
    return await BlockModel.findOne({ where: { id: blockId } });
  }

  async excludeTestFromAll(testId: number): Promise<boolean> {
    return await this.testBlockProvider.removeAllRelations(testId)
  }

  async includes(blockId: number): Promise<TestModel[]> {
    const blocks = await this.getAll({
      id: blockId
    });
    const ids = [];
    const tests: TestModel[] = []
    blocks.map(el => {
      el.tests.map(test => {
        if (!ids.includes(test.id))
          tests.push(test);
      })
    })
    return tests;
  }

  async excludeTest(testId: number, blockId: number, host: { transaction: Transaction }, confirmLast: boolean = false): Promise<boolean> {
   return await this.testBlockProvider.exclude(testId, blockId, host, confirmLast);
  }

  async appendTests(blockId: number, tests: number[], host: { transaction: Transaction }): Promise<boolean> {
    const relation = (await this.testBlockProvider.getTests(blockId))
    tests = tests.filter(el => {
      if (relation.includes(el))
        throw new HttpException("Double record", 409);
      else
        return true;
    });
    return !!(await this.testBlockProvider.create(this.createTestBlockDto(blockId, tests), host));
  }

  async copyToCompany(blockId: number, companyId: any): Promise<BlockModel> {
    const block = await this.getOne(blockId, true);
    return await this.create({
      name: block.name,
      company_id: parseInt(companyId),
      tests: await this.testBlockProvider.getTests(block.id)
    });
  }

  async onCompanyRemove(companyId: number, removeBlocks: boolean): Promise<boolean> {
    if (removeBlocks) {
      await Promise.all((await BlockModel.findAll({
        where: {
          company_id: companyId
        }
      })).map(async el => {
        await this.remove(el.id);
      }));
      return true;
    } else {
      return !!(await BlockModel.update({
        company_id: null
      }, {
        where: {
          company_id: companyId
        }
      }));
    }

  }
}
