import { Sequelize, DataTypes } from "sequelize";

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './data.db'//doc banco na raiz
})

function geraNome() { // gera nome default random caso campo seja null

    var randomStr = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < 12; i++){
        var indice = Math.floor(Math.random() * characters.length);
        randomStr += characters[indice]
    }
    return randomStr //var de nome
}
                                        /*TABELAS*/
// RESPONSAVEIS
export const Responsaveis = sequelize.define('Responsaveis',{
    ID_responsaveis:{
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    password_resp:{
        type: DataTypes.STRING(30),
        allowNull: false,
    },
    email_resp:{
        type: DataTypes.STRING(254),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true, // valida formato de e-mail
            len : [6,254]
        }
    },
    name_resp:{
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue : () => geraNome()
    }
})

// CONTROLE
export const Controle = sequelize.define('Controle',{
    limitado:{
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    tempoTela:{
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
})

// USUARIOS
export const Usuarios = sequelize.define('Usuarios',{
    ID_usuarios:{
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    password_user:{
        type: DataTypes.STRING(30),
        allowNull: false,
    },
    email_user:{
        type: DataTypes.STRING(254),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true, // valida formato de e-mail
            len : [6,254]
        }
    },
    name_user:{
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue : () => geraNome()
    },
    XP_user:{
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    responsavel_vinculado:{
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    idade: {
    type: DataTypes.INTEGER,
    allowNull: false
    }
});
                                        /*RELACIONAMENTOS*/
Responsaveis.belongsToMany(Usuarios,{
    through: Controle,    
    foreignKey: 'ID_responsaveis',
    otherKey: 'ID_usuarios'
});

Usuarios.belongsToMany(Responsaveis, {
    through: Controle,
    foreignKey: 'ID_usuarios',
    otherKey: 'ID_responsaveis'
});

Controle.belongsTo(Responsaveis, { foreignKey: 'ID_responsaveis' });
Controle.belongsTo(Usuarios, { foreignKey: 'ID_usuarios' });

sequelize.sync({ force: true }).then(() => {
    console.log("Tabelas criadas!");
});