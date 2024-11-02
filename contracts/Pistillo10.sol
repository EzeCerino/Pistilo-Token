// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Pistilo10 is ERC20, Ownable {
    struct BurnSchedule {
        uint256 id;
        uint256 burnAmount;
        uint256 expiryDate;
    }

    // Mapeo de cuentas para la quema y guardo en un array las cuentas que van transaccionando
    mapping(uint256 => BurnSchedule) public burnSchedules;

    uint256[] public burnScheduleQueue; // guardamos los id cola FIFO
    uint256 public nextBurnScheduleId; // ID incremental
    uint256 public firstBurnScheduleId; // Mantiene la referencia del primer ID en la cola FIFO

    event Pistilo10__TokenMinted(string message, uint256 nextBurnScheduleId);
    event Pistilo10__TokenMinted__neto(string message, uint256 amountneto);
    event Pistilo10__TokenMinted__total(
        string message,
        uint256 nextBurnScheduleId
    );
    event Pistilo10__token_Vencios(string message, uint256 amount);
    event Pistilo10__token_Total(string message, uint256 amount);

    event LogMessage(string message, uint256 valor);

    //event LogMessage_2(string message, uint256 valor);

    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) Ownable(msg.sender) {
        nextBurnScheduleId = 0;
        firstBurnScheduleId = 0;
    }

    // Función para mintear tokens
    function mint(uint256 amount) internal onlyOwner {
        // Para el primer minteo o si está cubierta la deuda
        if (
            burnScheduleQueue.length == 0 ||
            burnScheduleQueue.length == firstBurnScheduleId
        ) {
            _mint(owner(), amount);
            nextBurnScheduleId++;
            // Añadir el ID al array de la cola FIFO
            burnScheduleQueue.push(nextBurnScheduleId);
            // Crear un nuevo BurnSchedule con vencimiento en 5 años
            burnSchedules[nextBurnScheduleId] = BurnSchedule({
                id: nextBurnScheduleId,
                burnAmount: amount,
                expiryDate: block.timestamp + 2 minutes
                //expiryDate: block.timestamp + 5 * 365 days
            });
            emit Pistilo10__TokenMinted(
                "Se mintearon todos los tokens, id schedule: ",
                nextBurnScheduleId
            );
            return;
        }
        uint256 burnScheduleId = burnScheduleQueue[firstBurnScheduleId];
        BurnSchedule storage schedule = burnSchedules[burnScheduleId];

        // Verificar si el owner tiene una deuda de quema
        if (block.timestamp > schedule.expiryDate) {
            // Si tiene una deuda, se queman los tokens recién minteados. Si la deuda es mayor a lo que va a mintear o si es menor.
            if (schedule.burnAmount >= amount) {
                if (schedule.burnAmount == amount) {
                    firstBurnScheduleId++;
                    emit LogMessage(
                        "Se quemaron la totalidad de los tokens a mintear",
                        amount
                    );
                    return;
                }
                _burn(owner(), amount);
                schedule.burnAmount = schedule.burnAmount - amount;
                emit LogMessage(
                    "Se quemaron la totalidad de los tokens a mintear, saldo en deuda: ",
                    schedule.burnAmount
                );
            } else {
                uint256 amount_neto = amount - schedule.burnAmount;
                // MINTEAR SOLO EL NETO
                _mint(owner(), amount_neto);
                nextBurnScheduleId++;
                burnScheduleQueue.push(nextBurnScheduleId);
                firstBurnScheduleId++;
                // Crear un nuevo BurnSchedule con vencimiento en 5 años
                burnSchedules[nextBurnScheduleId] = BurnSchedule({
                    id: nextBurnScheduleId,
                    burnAmount: amount, // creo que deberia ser el amount no el neto
                    expiryDate: block.timestamp + 2 minutes
                    //expiryDate: block.timestamp + 5 * 365 days
                });
                emit Pistilo10__TokenMinted__neto(
                    "Usted poseia un vencimiento de quema de tokens, se mintearon esta cantidad de tokens: ",
                    amount_neto
                );
            }
        } else {
            // Si no tiene deuda, se mintean los tokens y se asigna un vencimiento de 5 años para la quema
            _mint(owner(), amount);
            nextBurnScheduleId++;
            // Añadir el ID al array de la cola FIFO
            burnScheduleQueue.push(nextBurnScheduleId);
            // Crear un nuevo BurnSchedule con vencimiento en 5 años
            burnSchedules[nextBurnScheduleId] = BurnSchedule({
                id: nextBurnScheduleId,
                burnAmount: amount,
                expiryDate: block.timestamp + 2 minutes
                //expiryDate: block.timestamp + 5 * 365 days
            });

            emit Pistilo10__TokenMinted__total(
                "Se mintearon todos los tokens, id schedule: ",
                nextBurnScheduleId
            );
        }
    }

    function mintTokens(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        //se podria establecer una restriccion para minteo
        mint(amount);
    }

    // Función que tiene que ser llamada por un oráculo para ejecutar la quema, chainlink
    function burnExpiredTokens() external {
        require(
            burnScheduleQueue.length != firstBurnScheduleId,
            "No burn schedules in queue"
        );
        require(balanceOf(owner()) > 0, "No balance for burn");
        uint256 burnScheduleId = burnScheduleQueue[firstBurnScheduleId];
        BurnSchedule storage schedule = burnSchedules[burnScheduleId];
        require(
            block.timestamp > schedule.expiryDate,
            "The schedule has not expiry yet"
        );

        if (balanceOf(owner()) >= schedule.burnAmount) {
            _burn(owner(), schedule.burnAmount);
            firstBurnScheduleId++;
            emit Pistilo10__token_Vencios(
                "Usted contaba con tokens vencidos, se procede a la quema de la siguiente cantidad: ",
                schedule.burnAmount
            );
        } else {
            uint256 difference = schedule.burnAmount - balanceOf(owner());
            _burn(owner(), balanceOf(owner()));
            schedule.burnAmount = difference;
            emit Pistilo10__token_Total(
                "Usted contaba con tokens vencidos, se procede a la quema de todos sus tokens: ",
                balanceOf(owner())
            );
        }
    }

    // Función auxiliar para obtener la información del BurnSchedule por ID
    function getBurnSchedule(
        uint256 id
    )
        external
        view
        returns (uint256, uint256, uint256, uint256, uint256[] memory ref)
    {
        BurnSchedule memory schedule = burnSchedules[id];

        return (
            schedule.burnAmount,
            schedule.expiryDate,
            firstBurnScheduleId,
            nextBurnScheduleId,
            burnScheduleQueue
        );
    }

    //geters//
    //totalSupply//
    function getTotalSupply() public view returns (uint256) {
        uint256 totalSupply = totalSupply();
        return totalSupply;
    }

    function getCurrentTimeStamp() public view returns (uint256) {
        return block.timestamp;
    }
}
