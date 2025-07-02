"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateResidentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_resident_dto_1 = require("./create-resident.dto");
class UpdateResidentDto extends (0, swagger_1.PartialType)(create_resident_dto_1.CreateResidentDto) {
}
exports.UpdateResidentDto = UpdateResidentDto;
//# sourceMappingURL=update-resident.dto.js.map